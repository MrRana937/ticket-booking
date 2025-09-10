const db = require('../config/db');

/**
 * Seat booking algorithm with two-phase optimization:
 * 1. Try to find contiguous seats in a single row 
 * 2. Fallback to closest available seats across rows
 * avoiding race conditions using transactions
 */
exports.bookSeats = async (req, res) => {
    console.log('bookSeats for request');
    const { numSeats } = req.body;
    const userId = null; // TODO:

    if (!numSeats || numSeats < 1 || numSeats > 7) {
        return res.status(400).json({ msg: 'Number of seats must be between 1 and 7.' });
    }

    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        // Phase 1: Prefer contiguous seats in single row
        let seatsToBook = await findSeatsInOneRow(client, numSeats);

        // Phase 2: Fallback to closest available seats
        if (seatsToBook.length === 0) {
            seatsToBook = await findClosestSeats(client, numSeats);
        }

        if (seatsToBook.length < numSeats) {
            await client.query('ROLLBACK');
            return res.status(400).json({ msg: 'Not enough available seats to fulfill the request.' });
        }

        // Atomic seat booking with row-level locking
        const seatIds = seatsToBook.map(s => s.id);
        const updateQuery = `
            UPDATE seats 
            SET is_booked = TRUE, booked_by_user_id = $1 
            WHERE id = ANY($2::int[])
            RETURNING *;`;
        const { rows: bookedSeats } = await client.query(updateQuery, [userId, seatIds]);
        
        await client.query('COMMIT');
        res.json({ msg: 'Seats booked successfully!', bookedSeats });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error.message);
        res.status(500).send('Server Error');
    } finally {
        client.release();
    }
};

/**
 * Contiguous seat finder using sliding window algorithm
 * Groups seats by row and finds first available contiguous block
 */
async function findSeatsInOneRow(client, numSeats) {
    const { rows: availableSeats } = await client.query(
        `SELECT id, row_number FROM seats WHERE is_booked = FALSE ORDER BY row_number, id FOR UPDATE`
    );

    // Group seats by row for efficient contiguous search
    const rows = {};
    availableSeats.forEach(seat => {
        if (!rows[seat.row_number]) {
            rows[seat.row_number] = [];
        }
        rows[seat.row_number].push(seat);
    });

    // Sliding window to find contiguous seats in each row
    for (const rowNum in rows) {
        const rowSeats = rows[rowNum];
        if (rowSeats.length >= numSeats) {
            for (let i = 0; i <= rowSeats.length - numSeats; i++) {
                const potentialBlock = rowSeats.slice(i, i + numSeats);
                // Verify contiguity by checking ID sequence
                if (potentialBlock[potentialBlock.length - 1].id - potentialBlock[0].id === numSeats - 1) {
                    return potentialBlock;
                }
            }
        }
    }
    return [];
}

/**
 * Fallback algorithm:  simply minimising the diff between the max and min in a window and our 
 * answer is the window that minimises the diff
 */
async function findClosestSeats(client, numSeats) {
    const { rows: availableSeats } = await client.query(
        `SELECT id FROM seats WHERE is_booked = FALSE ORDER BY id FOR UPDATE`
    );

    if (availableSeats.length < numSeats) {
        return [];
    }

    let minDiff = Infinity;
    let bestChoice = [];

    // Sliding window to minimize seat distance
    for (let i = 0; i <= availableSeats.length - numSeats; i++) {
        const window = availableSeats.slice(i, i + numSeats);
        const diff = window[window.length - 1].id - window[0].id;

        if (diff < minDiff) {
            minDiff = diff;
            bestChoice = window;
        }
    }
    return bestChoice;
}


exports.getAllSeats = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM seats ORDER BY id');
        res.json(rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

exports.resetBooking = async (req, res) => {
     try {
        await db.query('UPDATE seats SET is_booked = FALSE, booked_by_user_id = NULL');
        res.json({ msg: 'All seats have been reset and are now available.' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};