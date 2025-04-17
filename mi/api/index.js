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
import util from'util';
import moment from 'moment'
//import twilio from 'twilio';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
// import sendLowStockAlert from'./services/smsService'; // Import the function
//import inventoryRoutes from './routes/inventoryroutes.js';
//import {inventoryRoutes} from './routes/inventoryroutes.js';


//----------------------------------------------------------------------------------------------------------------------------------------
// Set up MySQL db 
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

// Session middleware
const app = express();

//const app = express.app();

const SECRET_KEY = 'your_secret_key'; // Replace with a more secure key in production

// Middleware
 // To parse JSON bodies
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true })); // Allow CORS from React app
app.use(session({
  secret: 'your-secret-key',  // Change this to a secure key
  resave: false,
  saveUninitialized: false,
  cookie: { 
    httpOnly: true, 
    secure: false,  // Set this to 'true' in production if using https
    maxAge: 1000 * 60 * 60 * 24 // Optional: 1-day expiration
  }
}));

//app.use('/inventory', inventoryRoutes);

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'anshulaverma555@gmail.com',        // Your Gmail address
    pass: 'ptdl aatf dosd ogzf' // Your generated App Password
  },
  logger: true
});

const mailOptions = {
  from: process.env.SMTP_USER, // From the .env file
  to: 'recipient-email@example.com',
  subject: 'Your OTP Code',
  text: `Your OTP is: 309652`
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log('Error sending email:', error);
  } else {
    console.log('Email sent:', info.response);
  }
 
});


//module.exports = transporter;


// Function to send OTP email
// Send OTP email
const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,  // Sender address
    to: email,                    // Recipient address
    subject: 'Your OTP Code',      // Subject line
    text: `Your OTP code is: ${otp}`, // OTP message
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending OTP:', error);
  }
};

// export { sendOtpEmail };
// Example usage: send order notification
const sendOrderNotification = (adminEmail, order) => {
  const subject = `New Order Received: ${order.order_id}`;
  const htmlContent = `
    <h2>New Order Placed</h2>
    <p>Order ID: ${order.order_id}</p>
    <p>Customer: ${order.customer_name}</p>
    <p>Total: $${order.total_amount}</p>
    <p><a href="${order.order_link}">View Order</a></p>
  `;
  sendEmail(adminEmail, subject, 'New order placed', htmlContent);
};


//app.use('/check-inventory', inventoryRoutes);
//----------------------------------------------------------------------------------------------------------------------------------------

let products = [];

// Protected route for role-based access
const roleRequired = (requiredRole) => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ error: 'You need to login first' });
    }
    if (req.session.user.role !== requiredRole) {
      return res.status(403).json({ error: 'Access denied, insufficient role' });
    }
    next();
  };
};


const authenticateSeller = (req, res, next) => {
if (!req.session.user_id) {
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


//---------------------------------------------------------------------------------------------------------------------------------------



app.get('/admin', authenticateSession, (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  res.json({ message: 'Welcome to the Admin Dashboard' });
});
//---------------------------------------------------------------------------------------------------------------------------------------

// User registration
app.post('/register', (req, res) => {
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
app.post('/login', async (req, res) => {
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

      req.session.user = { id: user.user_id, username: user.username, role: user.role };
      req.session.userId = user.user_id;

      console.log('User logged in:', req.session.user);

      res.status(200).json({
        message: 'Login successful',
        user: { id: user.user_id, username: user.username, role: user.role }
      });
    });
  } catch (err) {
    console.error('Error during login:', err);
    return res.status(500).json({ message: 'An error occurred during login.', error: err.message });
  }
});

// Check if user is logged in
app.get('/check-login', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ userId: req.session.userId });
  } else {
    return res.status(401).json({ message: 'Unauthorized' });
  }
});

// Get user details
app.get('/user-details', authenticateSession, (req, res) => {
  res.status(200).json({
    user: req.session.user,
  });
});

// Dashboard route (requires an active session)
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.status(403).json({ message: 'Access Denied' }); // No session found, user is not authenticated
  }

  const { role } = req.session.user;  // Get the role from the session

  // Respond with the user's role
  res.json({ role });
});

// Logout route to destroy the session
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to log out' });
    }

    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

// Logout Route to clear session
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
      if (err) {
          return res.status(500).json({ message: 'Could not log out' });
      }
      res.json({ message: 'Logout successful' });
  });
});


const authenticateAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access Denied' });
  }
  next();
};

// Endpoint to handle adding a new product
// // Endpoint to get all products
// app.get('/AddProductForm', (req, res) => {
//   res.json(products);
// });
//----------------------------------------------------------------------------------------------------------------------------------------


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


//----------------------------------------------------------------------------------------------------------------------------------------
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

//--------------------------------------------------------------------------------------------------------------------------------------
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
//=======================================================================================================================================


// Add product to cart
app.post('/add-to-cart', authenticateSession, (req, res) => {
  const userId = req.session.user.id;
  const { product_id, quantity, total_price, name } = req.body;

  db.query('SELECT * FROM cart WHERE user_id = ? AND product_id = ?', [userId, product_id], (err, results) => {
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
        [userId, product_id, quantity, total_price, name],
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
app.get('/get-cart/:userId', authenticateSession, (req, res) => {
  const userId = req.session.user.id;

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
app.delete('/delete-from-cart/:userId/:productId', authenticateSession, (req, res) => {
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


db.query = util.promisify(db.query);

app.post('/checkout', async (req, res) => {
  const { user_id, cart_items, shipping_info, totalPrice } = req.body;
  const shippingInfoString = JSON.stringify(shipping_info);  // Convert shipping info to JSON string
  const cartItemsString = JSON.stringify(cart_items);  // Convert cart items to JSON string

  // Log incoming data for debugging
  console.log('Received checkout data:', req.body);

  // Validate input
  if (!user_id || !cart_items || cart_items.length === 0 || !shipping_info || totalPrice === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Ensure totalPrice is a valid number
  if (isNaN(totalPrice) || totalPrice <= 0) {
    return res.status(400).json({ error: 'Invalid total price' });
  }

  // SQL query to insert the order into the 'orders' table
  const query = `
    INSERT INTO orders (user_id, shipping_info, items, total_price)
    VALUES (?, ?, ?, ?)
  `;

  try {
    // Execute the SQL query
    const results = await db.query(query, [user_id, shippingInfoString, cartItemsString, totalPrice]);
    console.log('Order created successfully:', results);

    res.status(200).json({ message: 'Checkout successful!' });
  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({ error: 'Error processing the checkout', details: error.message });
  }
});
//======================================================================================================================================

// Route to add a coupon (only for sellers)
app.post('/coupons', authenticateSession, (req, res) => {
  const { code, discount, expirationDate } = req.body;
  const userId=req.session.user.id;

  if (!code || !discount || !expirationDate) {
    return res.status(400).json({ message: 'Coupon code, discount, and expiration date are required' });
  }

  const query = 'INSERT INTO coupons (code, discount, expiry_date) VALUES (?, ?, ?)';
  db.query(query, [code, discount, expirationDate], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error adding coupon', error: err.message });
    }
    res.status(201).json({ message: 'Coupon added successfully' });
  });
});

// Route to get all coupons (for sellers or admins)
app.get('/coupons', (req, res) => {
  db.query('SELECT * FROM coupons', (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching coupons' });
    }
    res.json({ coupons: results });
  });
});


// Backend Code - Applying Coupon
app.post('/apply-coupon', (req, res) => {
  const { couponCode, orderTotal } = req.body;

  if (!couponCode || !orderTotal) {
    return res.status(400).json({ message: 'Coupon code and order total are required' });
  }

  // Fetch the coupon from the database
  const query = 'SELECT * FROM coupons WHERE code = ? AND is_active = TRUE';
  db.query(query, [couponCode], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Coupon not found or expired' });
    }

    const coupon = rows[0];

    // Check expiration date
    if (coupon.expiration_date && moment().isAfter(coupon.expiration_date)) {
      return res.status(400).json({ message: 'Coupon has expired' });
    }

    // Validate coupon type
    const validCouponTypes = ['percentage', 'fixed'];
    if (!validCouponTypes.includes(coupon.type)) {
      return res.status(400).json({ message: 'Invalid coupon type' });
    }

    // Apply the discount
    let discountAmount = 0;

    if (coupon.type === 'percentage') {
      discountAmount = (orderTotal * coupon.discount) / 100;
    } else if (coupon.type === 'fixed') {
      discountAmount = coupon.discount;
    }

    // Ensure the discount doesn't exceed the order total
    if (discountAmount > orderTotal) {
      discountAmount = orderTotal;
    }

    // Return the final discounted total
    const finalTotal = orderTotal - discountAmount;
    res.json({
      message: 'Coupon applied successfully',
      discountAmount,
      finalTotal,
    });
  });
});




//==================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------


// Get reviews for a product
app.get('/reviews/:productId', (req, res) => {
  const { productId } = req.params;

  db.query('SELECT * FROM reviews WHERE product_id = ?', [productId], (err, results) => {
    if (err) {
      console.error('Error fetching reviews:', err);
      return res.status(500).json({ message: 'Failed to fetch reviews' });
    }

    res.json(results);
  });
});

// Submit a review
app.post('/reviews/:productId',authenticateSession,(req, res) => {
  const { productId} = req.params;
  const { rating, comment } = req.body;
  const userId = req.session.user.id; // Assume user is authenticated and session contains userId

  if (!rating || !comment) {
    return res.status(400).json({ message: 'Please provide both rating and comment' });
  }

  const query = 'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)';
  db.query(query, [productId, userId, rating, comment], (err, results) => {
    if (err) {
      console.error('Error submitting review:', err);
      console.log(userId,"YOU AREN'T CRAZYYYYYYY IN LOVEEEEEEEE")
      return res.status(500).json({ message: 'Failed to submit review' });
    }

    const newReview = {
      id: results.insertId,
      product_id: productId,
      user:userId, // Replace with actual user data if needed
      rating,
      comment,
    };

    res.json(newReview); // Return the newly added review
  });
});

//-----------------------------------------------------------------------------------------------------------------------------------



// Get orders for a seller
app.get('/seller/orders/:sellerId', (req, res) => {
  const sellerId = req.params.sellerId;

  const query = `
    SELECT orders.order_id, orders.total_price, orders.shipping_info, orders.created_at, 
           order_status.status AS order_status, 
           order_items.product_id, order_items.quantity, order_items.price
    FROM orders
    JOIN order_items ON orders.order_id = order_items.order_id
    JOIN order_status ON orders.order_id = order_status.order_id
    WHERE orders.seller_id = ?
  `;

  db.query(query, [sellerId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching orders', error: err.message });
    }

    // Format results into orders with items
    const orders = results.reduce((acc, row) => {
      const existingOrder = acc.find(order => order.order_id === row.order_id);
      if (existingOrder) {
        existingOrder.items.push({
          product_id: row.product_id,
          quantity: row.quantity,
          price: row.price,
        });
      } else {
        acc.push({
          order_id: row.order_id,
          total_price: row.total_price,
          shipping_info: row.shipping_info,
          created_at: row.created_at,
          order_status: row.order_status,
          items: [{
            product_id: row.product_id,
            quantity: row.quantity,
            price: row.price,
          }]
        });
      }
      return acc;
    }, []);

    res.json({ orders });
  });
});
//======================================================================================================================================
//--------------------------------------------------------------------------------------------------------------------------------------

// Admin route to get all users (or any other data)
app.get('/admin/users', (req, res) => {
  const query = 'SELECT * FROM users'; // Replace 'users' with the correct table name
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching data', error: err });
    }
    res.json(results); // Send the result to the frontend
  });
});

//================================================================================================================================
//--------------------------------------------------------------------------------------------------------------------------------
// Admin route to fetch all queries (for solving by admin)
app.get('/admin/queries', authenticateAdmin, (req, res) => {
  const query = 'SELECT * FROM queries WHERE status = "pending"';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching data', error: err });
    }
    res.json(results); // Send the result to the frontend
  });
});


app.put('/admin/resolve-query',authenticateAdmin, (req, res) => {
  const { query_id, resolution } = req.body;

  // Update query status to "resolved" and add the resolution
  const query = 'UPDATE queries SET status = "resolved", resolution = ?, resolved_by = ? WHERE query_id = ?';
  db.query(query, [resolution, req.session.user.id, query_id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error resolving query', error: err });
    }
    res.json({ message: 'Query resolved successfully' });
  });
});


// Admin route to solve queries
app.post('/admin/resolve-query', (req, res) => {
  // Check if user is logged in and is an admin
  if (!req.session.user || req.session.user.role !== 'admin') {
    console.log('Unauthorized access attempt');
    return res.status(403).json({ message: 'Access Denied' });
  }

  const { queryId, resolution } = req.body;

  if (!queryId || !resolution) {
    return res.status(400).json({ message: 'Query ID and resolution are required' });
  }

  console.log('Resolving query:', queryId);
  console.log('Resolution:', resolution);

  const query = 'UPDATE queries SET resolution = ?, status = ? WHERE query_id = ?';
  db.query(query, [resolution, 'resolved', queryId], (err, result) => {
    if (err) {
      console.error('Error in database query:', err);  // Log the database error
      return res.status(500).json({ message: 'Error resolving query', error: err });
    }

    if (result.affectedRows === 0) {
      console.log('No query found or already resolved:', queryId);
      return res.status(404).json({ message: 'Query not found or already resolved' });
    }

    res.json({ message: 'Query resolved successfully' });
  });
});


// Protected route for user queries
app.get('/user/queries', (req, res) => {
  if (!req.session.user) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  const userId = req.session.user.id;
  const query = 'SELECT * FROM queries WHERE user_id = ?';

  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching queries', error: err });
    }
    res.json(results);
  });
});


// app.post('/user/queries',authenticateSession,(req, res) => {
//   const user_id = req.session.user.id; 
//   const queri=req.body;// Assuming user_id is in the token payload

//   const query = 'SELECT * FROM queries WHERE user_id = ?';
//   db.query(query, [user_id], (err, results) => {
//     if (err) {
//       return res.status(500).json({ message: 'Error fetching data', error: err });
//     }
//     res.json(results); // Send the result to the frontend (user queries)
//   });
// });


app.post('/user/queries', authenticateSession, (req, res) => {
  const user_id = req.session.user.id; // Get user_id from session
  const { query_text, query_type } = req.body; // Get query text and type from request body

  // Validate input data
  if (!query_text || !query_type) {
    return res.status(400).json({ message: 'Query text and type are required.' });
  }

  // Insert query into the database
  const query = 'INSERT INTO queries (user_id, query_type, query_text) VALUES (?, ?, ?)';
  db.query(query, [user_id, query_type, query_text], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error inserting query', error: err });
    }

    // Respond with the query ID after successful insertion
    res.status(201).json({
      message: 'Query submitted successfully!',
      query_id: result.insertId, // Return the query ID that was just inserted
    });
  });
});
//---------------------------------------------------------------------------------------------------------------------------------------
//=======================================================================================================================================


// Example endpoint: Check product stock and send an alert if it's low
app.post('/check-inventory', (req, res) => {
  const { productId, productName, stockQuantity, updateLink } = req.body;

  // Example condition to check low stock
  if (stockQuantity < 10) {
    const adminPhone = '+1234567890';  // Admin phone number (replace with real number)
    const product = {
      name: productName,
      stock_quantity: stockQuantity,
      update_link: updateLink
    };
    sendLowStockAlert(adminPhone, product);  // Send low stock alert
    return res.status(200).json({ message: 'Low stock alert sent to admin.' });
  }

  return res.status(200).json({ message: 'Stock is sufficient.' });
});
//--------------------------------------------------------------------------------------------------------------------------------------

// Initialize dotenv to use environment variables
dotenv.config();

// Set up express app
app.use(express.json()); // Middleware for JSON request bodies



// OTP generation function
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};


// Endpoint to request OTP
app.post('/request-otp', (req, res) => {
  const { email } = req.body;

  // Generate a 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  // Store the OTP and associate it with the email (in a real app, you would store it in a DB)
  // For demo purposes, we're just logging it
  console.log('Generated OTP:', otp);

  // Send OTP via email
  sendOtpEmail(email, otp);

  // Respond back to the frontend
  res.status(200).send('OTP has been sent to your email!');
});

// Endpoint to verify OTP
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  // Here, you'd check if the OTP matches the one stored for this email.
  // For demo purposes, just check if OTP is 6 digits.
  if (otp.length === 6) {
    res.status(200).send('OTP verified successfully!');
  } else {
    res.status(400).send('Invalid OTP!');
  }
});


//=======================================================================================================================================
//-------------------------------------------------------------------------------------------------------------------------------------
// // Set up the Twilio client
// const client = new twilio('YOUR_TWILIO_ACCOUNT_SID', 'YOUR_TWILIO_AUTH_TOKEN');

// // Middleware for parsing JSON body
// app.use(express.json());

// // API endpoint for sending SMS
// app.post('/send-sms', (req, res) => {
//   const { to, body } = req.body;

//   client.messages.create({
//     to: to, // recipient phone number
//     from: 'YOUR_TWILIO_PHONE_NUMBER', // Twilio number
//     body: body, // SMS content
//   })
//   .then(message => {
//     res.status(200).json({ success: true, messageSid: message.sid });
//   })
//   .catch(error => {
//     res.status(500).json({ success: false, error: error.message });
//   });
// });


//======================================================================================================================================

// dotenv.config();

// // Access your environment variables
// const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
// const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

// console.log('Twilio SID:', twilioAccountSid);
// console.log('Twilio Auth Token:', twilioAuthToken);



// app.post('/register', (req, res) => {
//   const { username, password, email, role = 'user' } = req.body;  // Default role set to 'user'

// const hashedPassword = bcrypt.hashSync(password, 10);

// const query = 'INSERT INTO users (username, password, email,role) VALUES (?, ?, ?,?)';
// db .query(query, [username, hashedPassword, email ,role ], (err, result) => {
//   if (err) {
//     console.error(err);
//     return res.status(500).json({ message: 'Server error' });
//   }
//   res.status(201).json({ message: 'User registered successfully' });
// });
// });

//------------------------------------------------------------------------------------------------------------------------------------

  
  // Admin dashboard (only accessible by admin)
  app.get('/admin', roleRequired('admin'), (req, res) => {
    res.json({ message: 'Welcome to the Admin Dashboard' });
  });


// Protected Route to get user role


// Logout route to destroy the session
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to log out' });
    }

    res.clearCookie('connect.sid'); // Clear the session cookie
    res.json({ message: 'Logged out successfully' });
  });
});

// Logout Route to clear session
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out' });
        }
        res.json({ message: 'Logout successful' });
    });
});




// sequelize.sync()
//   .then(() => console.log('Database synced successfully'))
//   .catch((error) => console.log('Error syncing database:', error));



// Promisify db.query so we can use async/await
db.query = util.promisify(db.query);

app.post('/checkout', async (req, res) => {
  const { user_id, cart_items, shipping_info, totalPrice } = req.body;
  const shippingInfoString = JSON.stringify(shipping_info);  // Convert shipping info to JSON string
  const cartItemsString = JSON.stringify(cart_items);  // Convert cart items to JSON string

  // Log incoming data for debugging
  console.log('Received checkout data:', req.body);

  // Validate input
  if (!user_id || !cart_items || cart_items.length === 0 || !shipping_info || totalPrice === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Ensure totalPrice is a valid number
  if (isNaN(totalPrice) || totalPrice <= 0) {
    return res.status(400).json({ error: 'Invalid total price' });
  }

  // SQL query to insert the order into the 'orders' table
  const query = `
    INSERT INTO orders (user_id, shipping_info, items, total_price)
    VALUES (?, ?, ?, ?)
  `;

  try {
    // Execute the SQL query
    const results = await db.query(query, [user_id, shippingInfoString, cartItemsString, totalPrice]);
    console.log('Order created successfully:', results);

    res.status(200).json({ message: 'Checkout successful!' });
  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({ error: 'Error processing the checkout', details: error.message });
  }
});

  

app.post('/order', (req, res) => {
  const { user_id, total_price, status, shipping_info, items } = req.body;

  const query = 'INSERT INTO orders (user_id, total_price, items, delivery_address) VALUES (?, ?, ?, ?)';
  db.query(query, [user_id, total_price, items, shipping_info], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error creating order' });
    }

    const orderId = result.insertId;

    // Insert order items
    const orderItems = items.map(item => [
      orderId,
      item.product_id,
      item.quantity,
      item.price,
    ]);

    const itemQuery = 'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?';
    db.query(itemQuery, [orderItems], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error adding order items' });
      }

      res.status(201).json({ message: 'Order created successfully', orderId });
    });
  });
});

// Get Order by ID
// Route to fetch order details along with items
app.get('/orders/:orderId', (req, res) => {
  const { orderId } = req.params;

  // Query to fetch order details
  const orderQuery = 'SELECT * FROM orders WHERE order_id = ?';
  db.query(orderQuery, [orderId], (err, orderResults) => {
    if (err) return res.status(500).json({ message: 'Error fetching order' });

    if (orderResults.length === 0) return res.status(404).json({ message: 'Order not found' });

    const order = orderResults[0];

    // Query to fetch order items
    const itemsQuery = 'SELECT * FROM order_status WHERE order_id = ?'; // Adjust table name
    db.query(itemsQuery, [orderId], (err, itemResults) => {
      if (err) return res.status(500).json({ message: 'Error fetching order items' });

      order.items = itemResults; // Add items to order object
      res.json({ order }); // Return the order with its items
    });
  });
});

// Get All Orders for a User
app.get('/orders/user/:userId', (req, res) => {
  const { userId } = req.params;

  const query = 'SELECT * FROM orders WHERE user_id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching orders' });

    res.json({ orders: results });
  });
});

app.listen(7000, () => {
    console.log(`Server running on http://localhost:7000`);
});


