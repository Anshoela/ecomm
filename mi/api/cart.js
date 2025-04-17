import express from 'express';
import mysql from'mysql2';
import bcrypt from'bcryptjs';
import jwt from'jsonwebtoken';
import cors from'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import multer from 'multer';
import * as fs from 'node:fs';
import path from 'path';
import bodyParser from 'body-parser';

const app = express();


const db  = mysql.createConnection({
    host: 'localhost',         // MySQL server host (localhost or IP address)
    user: 'root',              // MySQL username
    password: 'root',      // MySQL password
    database: 'test',  // MySQL database name
  });
  
db .connect((err) => {
    if (err) {
      console.error('Error connecting to the database:', err.stack);
      return;
    }
    console.log('Connected to the MySQL database as ID ' + db .threadId);
  });

  const SECRET_KEY = 'your_secret_key'; 

app.use(express.json()); // To parse JSON bodies
app.use(cors({ origin: 'http://localhost:3000', credentials: true })); // Allow CORS from React app


app.use(session({
    secret: SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true } // Use 'secure: true' if using HTTPS
  }));

  
  app.use(bodyParser.json());

  app.post('/add-to-cart', (req, res) => {
    const user_id = req.session.user.id;
    const { product_id, quantity } = req.body;
  
    // Check if the item already exists in the cart
    const checkQuery = `SELECT * FROM cart WHERE user_id = ? AND product_id = ?`;
    db.query(checkQuery, [user_id, product_id], (err, results) => {
      if (err) {
        return res.status(500).json({error: err.message });
      }
  
      if (results.length > 0) {
        // If the item exists, update the quantity
        const updateQuery = `UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?`;
        db.query(updateQuery, [quantity, user_id, product_id], (err, updateResults) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          return res.status(200).json({ message: 'Cart updated successfully' });
        });
      } else {
        // If the item doesn't exist, add a new entry to the cart
        const insertQuery = `INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)`;
        db.query(insertQuery, [user_id, product_id, quantity], (err, insertResults) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          return res.status(200).json({ message: 'Item added to cart successfully' });
        });
      }
    });
  });

  
  
  // Get all items in the cart for a specific user
  app.get('/cart/:user_id', (req, res) => {
    const { user_id } = req.params;
    const query = `
      SELECT p.id, p.name, p.price, p.image, c.quantity
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `;
    db.query(query, [user_id], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json(results);
    });
  });


//const router = express.Router();
//const db = require('./db'); // Assume you have a db module to interact with your database

// Route to save cart item
// app.post('/save-cart', async (req, res) => {
//   const user_id= req.session.user.id ;
//   const {  product_id, quantity, totalPrice } = req.body;

//   // Validate required fields
//   if (!user_id || !product_id || !quantity || !totalPrice) {
//     return res.status(400).json({ message: 'Missing required fields' });
//   }

//   // Check if the product exists
//   try {
//     const [product] = await db.query('SELECT * FROM add_product WHERE product_id = ?', [product_id]);
//     if (!product) {
//       return res.status(404).json({ message: 'Product not found' });
//     }

//     // Check if this user already has this product in the cart
//     const [existingCartItem] = await db.query('SELECT * FROM carts WHERE user_id = ? AND product_id = ?', [user_id, product_id]);

//     if (existingCartItem) {
//       // Update the quantity if the product already exists in the cart
//       const updatedQuantity = existingCartItem.quantity + quantity;
//       await db.query('UPDATE carts SET quantity = ?, total_price = ? WHERE cart_id = ?', [updatedQuantity, totalPrice, existingCartItem.cart_id]);
//       return res.status(200).json({ message: 'Cart updated successfully' });
//     } else {
//       // Insert the new item into the cart
//       await db.query('INSERT INTO carts (user_id, product_id, quantity, total_price) VALUES (?, ?, ?, ?)', [user_id, product_id, quantity, totalPrice]);
//       return res.status(201).json({ message: 'Item added to cart successfully' });
//     }

//   } catch (error) {
//     console.error('Error saving cart item:', error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// });


// Middleware to check if the user is authenticated
const authenticateSession = (req, res, next) => {
    if (!req.session.user) {
    return res.status(403).json({ message: 'Not authenticated' });
    }
    next();
  };


  app.get('/products',(req,res) =>{
    db .query('SELECT * FROM add_product', (err, results) => {
            if (err) return res.status(500).json({ message: 'Error fetching products' });
            res.json(results); // Send the product list as JSON
          });
  })

S
  // Get the cart items for a specific user
app.get('/get-cart/:userId', (req, res) => {
    const { userId } = req.session.user.id;
    
    // Fetch the user's cart
    db.query('SELECT * FROM carts WHERE user_id = ?', [userId], (err, carts) => {
        console.log(userId)
      if (err) return res.status(500).send('Error fetching cart');
  
      if (carts.length > 0) {
        const cartId = carts[0].id; // Assuming the user has one cart
        // Fetch the cart items for the cart
        db.query('SELECT * FROM cart_items WHERE cart_id = ?', [cartId], (err, cartItems) => {
          if (err) return res.status(500).send('Error fetching cart items');
          res.json(cartItems);
        });
      } else {
        res.status(404).send('Cart not found');
      }
    });
  });

  app.post('/save-cart',/*authenticateSession,*/ (req, res) => {
     const userId = req.session.user.id;
    const cartItems = req.body.cartItems; 
   // const user_id = req.body;
    //const user_id =  req.session.user.id;
    //const role=req.session.user.role;
   
     //console.log(user_id);

     //const cartItems = req.body.cartItems || []; // Default to empty array if not provided

  // Ensure cartItems is an array before processing
  if (Array.isArray(cartItems)) {
    // Process the cart items here
    cartItems.forEach(item => {
      console.log(item); // Example: processing each cart item
    });

    // Respond with success
    return res.status(200).json({ message: 'Cart saved successfully' });
}

  
   
   
     // if(!role === 'buyer')
     // {
     //   console.log("You have to be buyer to buy this item.")
     // }
     // Save each cart item to the database
     const query = `INSERT INTO cart (user_id, product_id, quantity, total_price) VALUES ?`;
   
     
   //  if (Array.isArray(cartItems)) {
   //   const values = cartItems.map(item => [
   //     user_id,
   //     item.product_id,
   //     item.quantity,
   //     item.total_price
   //   ]);
   //   db.query(query, [values], (err, result) => {
   //     // your db query logic
   //   });
   // } else {
   //   res.status(400).json({ success: false, message: 'Invalid cart items data' });
   // }
   
     const values = cartItems.map(item => [
       user_id,
       item.product_id,
       item.quantity,
       item.total_price
     ]);
     
     db.query(query, [values], (err, result) => {
       if (err) {
         console.error('Error saving cart:', err);
         //console.log(user_id);
         return res.status(500).json({ success: false, message: 'Error saving cart to database' });
         
       }
       res.json({ success: true, message: 'Cart saved successfully!' });
     });
   });


   app.post('/checkout', (req, res) => {
    const user = req.session.user;  // Assuming the user object is already available in session
    const { cartItems } = req.body;
  
    // Log the incoming data for debugging
    console.log('Received user:', user);
    console.log('Received cartItems:', cartItems);
  
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: 'Missing cart items' });
    }
  
    if (!user || !user.id) {
      return res.status(400).json({ message: 'Missing user details' });
    }
  
    const totalPrice = calculateTotal(cartItems);
  
    // Save order in the database
    db.query(
      'INSERT INTO orders (userId, totalPrice, status) VALUES (?, ?, ?)',
      [user.id, totalPrice, 'Pending'],
      (err, result) => {
        if (err) {
          console.error('Error inserting order:', err);
          return res.status(500).json({ message: 'Error processing order', error: err });
        }
  
        const orderId = result.insertId;
  
        // Save order items
        const orderItemsPromises = cartItems.map(item => {
          return new Promise((resolve, reject) => {
            db.query(
              'INSERT INTO order_items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)',
              [orderId, item.id, item.qty, item.price],
              (err, result) => {
                if (err) return reject(err);
                resolve(result);
              }
            );
          });
        });
  
        // Wait for all order items to be inserted
        Promise.all(orderItemsPromises)
          .then(() => {
            // Optionally, update product stock if necessary
            const stockUpdatesPromises = cartItems.map(item => {
              return new Promise((resolve, reject) => {
                db.query(
                  'UPDATE add_product SET stock = stock - ? WHERE id = ?',
                  [item.qty, item.id],
                  (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                  }
                );
              });
            });
  
            // Wait for all stock updates to be done
            return Promise.all(stockUpdatesPromises);
          })
          .then(() => {
            res.json({ success: true, orderId });
          })
          .catch((err) => {
            console.error('Error processing order items or updating stock:', err);
            res.status(500).json({ message: 'Error processing order items or updating stock', error: err });
          });
      }
    );
  });
  
  
  function calculateTotal(cartItems) {
    return cartItems.reduce((total, item) => total + item.qty * item.price, 0);
  }
  
   

   app.post('/cart', (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.session.user.id;
    //const userId = 1; // Assume a logged-in user with ID 1
  
    // Insert product into user's cart
    db.query(
      'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
      [userId, productId, quantity],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error adding product to cart');
        }
        res.status(201).send('Product added to cart');
      }
    );
  });

  // Fetch user's cart
app.get('/cart', (req, res) => {
    const userId = req.session.user.id; // Assume a logged-in user with ID 1
    db.query(
      'SELECT * FROM cart JOIN products ON cart.product_id = products.id WHERE cart.user_id = ?',
      [userId],
      (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error fetching cart');
        }
        res.json(results);
      }
    );
  });


   
app.listen(9000, () => {
    console.log(`Server running on http://localhost:9000`);
});
