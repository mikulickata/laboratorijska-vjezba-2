import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import asyncErrorHandler from './asyncErrorHandler';
import dotenv from 'dotenv'


dotenv.config();
const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
  },
});

// Omogućavanje CORS-a za sve izvore (frontend iz bilo kojeg porta)
app.use(cors({
  origin: process.env.FRONTEND_URL, // Zamijenite s točnom domenom frontend aplikacije
  methods: 'GET,POST,DELETE', // Dozvolite samo potrebne metode
  allowedHeaders: 'Content-Type,Authorization', // Dozvolite potrebne zaglavlje
  credentials: true,
}));

// Middleware za parsiranje JSON-a
app.use(express.json());

// Globalno stanje zaštite i admin statusa
let protectionEnabled = false;
let isAdmin = false;

// Ruta za aktivaciju/deaktivaciju zaštite
app.post('/toggleProtection', (req, res) => {
  protectionEnabled = !protectionEnabled;
  res.status(200).send({ status: protectionEnabled ? 'Protection enabled' : 'Protection disabled' });
});

// Ruta za aktivaciju/deaktivaciju admin statusa
app.post('/toggleAdmin', (req, res) => {
  isAdmin = !isAdmin;
  res.status(200).send({ status: isAdmin ? 'Admin logged in' : 'Admin logged out' });
});

// Ruta za dohvaćanje podataka s provjerom pristupa
app.get('/getUserData', asyncErrorHandler(async (req, res) => {
  const { username } = req.query;

  console.log(`Fetching data for user: ${username}`);

  if (!username) {
    return res.status(400).send('Username is required');
  }

  try {
    // Provjera da li korisnik postoji
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return res.status(404).send('User not found');
    }

    const user = result.rows[0];
    console.log('User data:', user);

    // Provjera zaštite
    console.log("protectionEnabled, isAdmin", protectionEnabled, isAdmin)
    if (protectionEnabled) {
      // Ako je zaštita uključena, razdvajamo pristup prema ulozi korisnika
      if (user.role === 'user') {
        // Korisnik može pristupiti samo svojim podacima
        return res.status(200).json(user);
      }

      // Ako je korisnik admin, ali nije prijavljen kao admin, pristup je zabranjen
      if (user.role === 'admin' && !isAdmin) {
        return res.status(403).send('Access Denied: Admin rights required');
      }

      // Ako je korisnik admin i prijavljen je kao admin, može vidjeti sve podatke
      if (user.role === 'admin' && isAdmin) {
        return res.status(200).json(user);
      }

      // Ako ništa drugo nije uspjelo, vraćamo 403
      return res.status(403).send('Access Denied: Invalid role or protection enabled');
    } else {
      // Ako zaštita nije aktivna, svi korisnici mogu vidjeti svoje podatke
      return res.status(200).json(user);
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    return res.status(500).send('Internal Server Error');
  }
}));

// Ruta za dohvaćanje svih korisničkih podataka (samo za admina kada je zaštita uključena)
app.get('/getAllUserData', asyncErrorHandler(async (req, res) => {
    const { username } = req.query;
    console.log("getAllUserData: ")
    if (!username) {
      return res.status(400).send('Username is required');
    }
  
    try {
      // Dohvati korisničku ulogu iz baze
      const result = await pool.query('SELECT role FROM users WHERE username = $1', [username]);
      if (result.rows.length === 0) {
        return res.status(404).send('User not found');
      }
  
      const { role } = result.rows[0];
      console.log("protectionEnabled, isAdmin", protectionEnabled, isAdmin);
  
      if (protectionEnabled) {
        if (isAdmin && role === 'admin') {
          // Admin sa aktivnom zaštitom može pristupiti svim podacima
          const users = await pool.query('SELECT * FROM users');
          return res.status(200).json(users.rows);
        } else {
            console.log("403: ")
          return res.status(403).send('Access Denied: Only admins can fetch all data when protection is enabled');
        }
      } else {
        // Ako zaštita nije uključena, svi korisnici mogu videti sve podatke
        const users = await pool.query('SELECT * FROM users');
        return res.status(200).json(users.rows);
      }
    } catch (error) {
      console.error('Error fetching all user data:', error);
      return res.status(500).send('Internal Server Error');
    }
  }));


// Označava je li XSS ranjivost omogućena
let xssEnabled = true;

// Ruta za omogućavanje/onemogućavanje XSS ranjivosti
app.post('/toggleXSS', (req, res) => {
  xssEnabled = !xssEnabled;
  res.status(200).send({ status: xssEnabled ? 'XSS enabled' : 'XSS disabled' });
});

// Ruta za spremanje korisničkog unosa
app.post('/submitInput', asyncErrorHandler(async (req, res) => {
  const { content } = req.body;
  console.log("submitInput content: ", content, xssEnabled)

  // Ako je XSS omogućen, unos se sprema bez sanitizacije
  let sanitizedContent = xssEnabled ? content : content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  console.log("sanitizedContent: ", sanitizedContent)
  // Spremanje u bazu (primjer; baza već ima tablicu 'user_inputs')
  await pool.query('INSERT INTO user_inputs (content) VALUES ($1)', [sanitizedContent]);
  res.status(200).send({ message: 'Input saved successfully' });
}));

// Ruta za dohvaćanje unosa (s mogućnošću XSS ranjivosti)
app.get('/getInputs', asyncErrorHandler(async (req, res) => {
  const result = await pool.query('SELECT content FROM user_inputs');
  res.status(200).json(result.rows);
}));

// Ruta za brisanje svih unosa iz tablice 'user_inputs'
app.delete('/clearInputs', asyncErrorHandler(async (req, res) => {
    try {
        console.log("clearInputs")
        await pool.query('DELETE FROM user_inputs');
        res.status(200).send({ message: 'All inputs cleared successfully' });
    } catch (error) {
        console.error('Error clearing inputs:', error);
        res.status(500).send('Failed to clear inputs');
    }
}));
  

app.listen(4000, () => console.log('Server running on port 4000'));
