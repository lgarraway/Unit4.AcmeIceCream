const pg = require('pg')
const express = require('express')
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_ice_cream_db')
const app = express()

const init = async () => {
    await client.connect();
    console.log('connected to database');
    let SQL = `
    DROP TABLE IF EXISTS flavor;
    CREATE TABLE flavor(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
    );
    `;
    await client.query(SQL);
    console.log('tables created');
    SQL = `
    INSERT INTO flavor(name, is_favorite) VALUES('chocolate', false);
    INSERT INTO flavor(name, is_favorite) VALUES('banana', false);
    INSERT INTO flavor(name, is_favorite) VALUES('vanilla', true);
    INSERT INTO flavor(name, is_favorite) VALUES('rocky road', false);
    INSERT INTO flavor(name, is_favorite) VALUES('strawberry', false);
    `;
    await client.query(SQL);
    console.log('data seeded');
    const port = process.env.PORT || 3000
    app.listen(port, () => console.log(`listening on port ${port}`))
}

init ();

app.use(express.json());
app.use(require('morgan')('dev'));
app.post('/api/flavor', async (req, res, next) => {
    try {
        const SQL = `
        INSERT INTO flavor(name)
        VALUES($1)
        RETURNING *
        `
        const response = await client.query(SQL, [req.body.name])
        res.send(response.rows[0])
    } catch(error) {
        next(error)
    }
});
app.get('/api/flavor', async (req, res, next) => {
    try {
        const SQL = `SELECT * from flavor`
        const response = await client.query(SQL)
        res.send(response.rows)
    } catch(error) {
        next(error)
    }
});
app.get('/api/flavor/:id', async (req, res, next) => {
    try {
        const SQL = `
        SELECT * from flavor
        WHERE id=$1
        `
        const response = await client.query(SQL, [req.params.id])
        res.send(response.rows[0])
    } catch(error) {
        next(error)
    }
});
app.put('/api/flavor/:id', async (req, res, next) => {
    try {
        const SQL = `
        UPDATE flavor
        SET name=$1, is_favorite=$2, updated_at= now()
        WHERE id=$3 RETURNING *
        `
        const response = await client.query(SQL, [req.body.name, req.body.favorite, req.params.id])
        res.send(response.rows[0])
    } catch(error) {
        next(error)
    }
});
app.delete('/api/flavor/:id', async (req, res, next) => {
    try {
        const SQL = `
        DELETE from flavor
        WHERE id=$1
        `
        const response = await client.query(SQL, [req.params.id])
        res.sendStatus(204)
    } catch(error) {
        next(error)
    }
});


