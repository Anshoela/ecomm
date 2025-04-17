// cartRoutes.js
import express from 'express';
import db from './db.js'; // Assuming db.js uses `export default`
import bcrypt from 'bcryptjs'; // Fixed bcrypt import (bcryptjs is commonly used for compatibility)
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import util from 'util';
import couponRoutes from './routes/couponRoutes.js'; // Fixed path if necessary

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const router = express.Router();

// Middleware for seller authentication
const authenticateSeller = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(403).json({ message: 'Not authenticated' });
  }
  next();
};

// Middleware to check if the user is authenticated
const authenticateSession = (req, res, next) => {
  if (!req.session.user) {
    return res.status(403).json({ message: 'Not authenticated' });
  }
  next();
};

// User registration
router.post('/register', (req, res) => {
  const { username, password, email, role = 'user' } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  const query = 'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)';
  db.query(query, [username, hashedPassword, email, role], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
    res.status(201).json({ message: 'User registered successfully' });
  });
});

// User login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Please provide both username and password.' });
  }

  try {
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, rows) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ message: 'Error during login', error: err.message });
      }

      if (rows.length === 0) {
        return res.status(401).json({ message: 'Invalid username or password.' });
      }

      const user = rows[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid username or password.' });
      }

      req.session.user_id = user.id;
      req.session.user = { id: user.id, username: user.username, role: user.role };
      req.session.userId = user.id;

      console.log('User logged in:', req.session.user);

      res.status(200).json({
        message: 'Login successful',
        user: { id: user.id, username: user.username, role: user.role }
      });
    });
  } catch (err) {
    console.error('Error during login:', err);
    return res.status(500).json({ message: 'An error occurred during login.', error: err.message });
  }
});

// Check if user is logged in
router.get('/check-login', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ userId: req.session.user.id });
  } else {
    return res.status(401).json({ message: 'Unauthorized' });
  }
});

// Get user details
router.get('/user-details', authenticateSession, (req, res) => {
  res.status(200).json({
    user: req.session.user,
  });
});

// Add product to cart
router.post('/add-to-cart', authenticateSession, (req, res) => {
  const user_id = req.session.user.id;
  const { product_id, quantity, total_price, name } = req.body;

  db.query('SELECT * FROM cart WHERE user_id = ? AND product_id = ?', [user_id, product_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length > 0) {
      db.query(
        'UPDATE cart SET quantity = quantity + ?, total_price = total_price + ? WHERE user_id = ? AND product_id = ?',
        [quantity, total_price, user_id, product_id],
        (err, results) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to update cart' });
          }
          res.json({ message: 'Cart updated successfully' });
        }
      );
    } else {
      db.query(
        'INSERT INTO cart (user_id, product_id, quantity, total_price, name) VALUES (?, ?, ?, ?, ?)',
        [user_id, product_id, quantity, total_price, name],
        (err, results) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to add to cart' });
          }
          res.json({ message: 'Product added to cart' });
        }
      );
    }
  });
});

// Get cart for a user
router.get('/get-cart/:userId', authenticateSession, (req, res) => {
  const userId = req.params.userId;

  db.query('SELECT * FROM cart WHERE user_id = ?', [userId], (err, results) => {
    if (err) {
      console.error('Error fetching cart:', err);
      return res.status(500).json({ message: 'Error fetching cart' });
    }

    if (results.length > 0) {
      res.json({ cart: results });
    } else {
      res.status(404).json({ message: 'No cart found for this user' });
    }
  });
});

// Remove product from cart
router.delete('/delete-from-cart/:userId/:productId', authenticateSession, (req, res) => {
  const { userId, productId } = req.params;

  db.query('DELETE FROM cart WHERE user_id = ? AND product_id = ?', [userId, productId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error removing product from cart' });
    }

    if (results.affectedRows > 0) {
      res.json({ message: 'Product removed from cart' });
    } else {
      res.status(404).json({ message: 'Product not found in cart' });
    }
  });
});

// Admin dashboard (only accessible by admin)
router.get('/admin', authenticateSession, (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  res.json({ message: 'Welcome to the Admin Dashboard' });
});

// Logout route to destroy the session
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to log out' });
    }

    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});


app.get('/AddProductForm', authenticateSession, (req, res) => {
    console.log('Session data:', req.session.user);  // Debugging: Log session data to check user ID
  
    // Ensure the session and user ID are valid
    if (!req.session || !req.session.user || !req.session.user.id) {
      return res.status(400).json({ error: 'Invalid session or user ID.' });
    }
  
    // Query to select products for the current seller
    db .execute('SELECT * FROM add_product WHERE sell_id = ?', [req.session.user.id], (err, results) => {
      if (err) {
        console.error('Database query error:', err);  // Log the error for debugging
        return res.status(500).json({ error: 'Database error', details: err.message });  // Send detailed error
      }
  
      // If no results, return a 404 response
      if (results.length === 0) {
        return res.status(404).json({ message: 'No products found for this seller.' });
      }
  
      // Return the results (products) as JSON
      res.json(results);
    });
  });

app.post('/AddProductForm', (req, res) => {
    const { name, price,type,image ,sell_id,qty} = req.body;
    db.query(
      'INSERT INTO add_product (name, price, type,image,sell_id,qty) VALUES (?, ?, ? ,? ,?,?)',
      [name, price, type,image,sell_id,qty],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error adding product');
        }
        res.json({ id: result.insertId, name, price, type,image ,sell_id,qty});
      }
    );
  });

// Update product route
app.put('/AddProductForm/:id', authenticateSession, (req, res) => {
    //const { id } = req.params;  // Product ID from route parameter
    const { name, type, price,id } = req.body;  // New product details from request body
    const seller_id = req.session.user.id;  // Seller's ID from the session
  
    // Debugging: Log product ID and seller ID
    console.log('Product ID:', id);
    console.log('Seller ID from session:', seller_id);
  
    // First, check if the product belongs to the seller
    db.query(
      'SELECT * FROM add_product WHERE id=? AND sell_id = ?',
      [id,seller_id],
      (err, results) => {
        if (err) {
          console.error('Database query error:', err);
          return res.status(500).json({ message: 'Internal Server Error', error: err.message });
        }
  
        // Debugging: Log the results from the query
        console.log('Query Results:', results);
  
        if (results.length === 0) {
          return res.status(403).json({ message: 'You are not authorized to update this product.' });
        }
  
        // Proceed with updating the product
        db.query(
          'UPDATE add_product SET name = ?, type = ?, price = ? WHERE id = ? AND sell_id = ?',
          [name, type, price, id, seller_id],
          (err, result) => {
            if (err) {
              console.error('Database query error during update:', err);
              return res.status(500).json({ message: 'Internal Server Error', error: err.message });
            }
  
            res.status(200).json({ message: 'Product updated successfully.' });
          }
        );
      }
    );
  });
  
// Get all products
app.get('/products', (req, res) => {
    const query = 'SELECT * FROM add_product'; // Assuming your products table is `add_product`
  
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching products:', err);
        return res.status(500).send({ message: 'Failed to fetch products' });
      }
      res.json(results); // Send products as JSON response
    });
  });

app.get('/get-user-id', (req, res) => {
    // Check if the user is authenticated (i.e., session contains user data)
    if (req.session && req.session.user && req.session.user.id) {
      // If user is authenticated, send the user ID back
      const userId = req.session.user.id;
      res.json({ userId }); // Sending the user ID in the response
    } else {
      // If the user is not authenticated, return a 401 Unauthorized error
      res.status(401).json({ message: 'User not authenticated' });
    }
  });

// Get cart items by user_id
app.get('/cart/:user_id', (req, res) => {
    const { user_id } = req.params;
    const query = 'SELECT * FROM cart WHERE user_id = ?';
  
    db.query(query, [user_id], (err, results) => {
      if (err) {
        console.error('Error fetching cart items:', err);
        return res.status(500).json({ message: 'Failed to fetch cart items' });
      }
      res.json(results); // Return the user's cart items
    });
  });
  

app.delete('/AddProductForm/:productId', async (req, res) => {
    const { productId } = req.params;
  
    db.query(
      'Delete from add_product WHERE id=?',
      [productId],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error adding product');
        }
        res.json({ productId})
      }
    );
  });

export default router; // Export using ESM



// // Add product to cart
// router.post('/add-to-cart', (req, res) => {
//   const user_id = req.session.user.id;
//   const { product_id, quantity, total_price, name } = req.body;

//   // Check if product already exists in the user's cart
//   db.query(
//     'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
//     [user_id, product_id],
//     (err, results) => {
//       if (err) {
//         return res.status(500).json({ error: 'Database error' });
//       }

//       if (results.length > 0) {
//         // Product exists, update quantity
//         db.query(
//           'UPDATE cart SET quantity = quantity + ?, total_price = total_price + ? WHERE user_id = ? AND product_id = ?',
//           [quantity, total_price, user_id, product_id],
//           (err, results) => {
//             if (err) {
//               return res.status(500).json({ error: 'Failed to update cart' });
//             }
//             res.json({ message: 'Cart updated successfully' });
//           }
//         );
//       } else {
//         // Product doesn't exist in the cart, add it
//         db.query(
//           'INSERT INTO cart (user_id, product_id, quantity, total_price, name) VALUES (?, ?, ?, ?, ?)',
//           [user_id, product_id, quantity, total_price, name],
//           (err, results) => {
//             if (err) {
//               return res.status(500).json({ error: 'Failed to add to cart' });
//             }
//             res.json({ message: 'Product added to cart' });
//           }
//         );
//       }
//     }
//   );
// });

// // Get user cart
// router.get('/get-cart/:userId', (req, res) => {
//   const userId = req.params.userId;

//   db.query('SELECT * FROM cart WHERE user_id = ?', [userId], (err, results) => {
//     if (err) {
//       return res.status(500).json({ message: 'Error fetching cart' });
//     }

//     if (results.length > 0) {
//       res.json({ cart: results });
//     } else {
//       res.status(404).json({ message: 'No cart found for this user' });
//     }
//   });
// });

// // Remove product from cart
// router.delete('/delete-from-cart/:userId/:productId', (req, res) => {
//   const { userId, productId } = req.params;

//   db.query('DELETE FROM cart WHERE user_id = ? AND product_id = ?', [userId, productId], (err, results) => {
//     if (err) {
//       return res.status(500).json({ message: 'Error removing product from cart' });
//     }

//     if (results.affectedRows > 0) {
//       res.json({ message: 'Product removed from cart' });
//     } else {
//       res.status(404).json({ message: 'Product not found in cart' });
//     }
//   });
// });

// module.exports = router;
