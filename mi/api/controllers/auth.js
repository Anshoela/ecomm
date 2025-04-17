import { db } from "../db.js";
import bcrypt from "bcryptjs";
export const register = (req,res)=>
{
    //CHECK EXISTING USER
    const q = "SELECT * FROM register WHERE email = ?";

    db.query(q,[req.body.email],(err,data)=>
    {
        
        if(err) return res.json(err);
        if(data.length) return res.status(409).json("User already Exist");

        //Hash the password and create a user
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(req.body.password,salt);

        const q = "INSERT INTO register(`email`,`password`) VALUES (?)"
        const values =[
            req.body.email,
            hash,
        ]

        db.query(q,[values],(err,data)=>{
            if (err) return res.json(err);
        return res.status(200).json("User has been created");
        });
    });
}
export const login = (req,res)=>
{
        
}
export const logout = (req,res)=>
{
    
}
export const AddProductForm =(req,res)=>
{
        const { id, name, price, cat, type, image } = req.body;
      
        // Check if all required fields are provided
        if (!name || !price || !cat || !type || !image) {
          return res.status(400).json({ error: 'Please provide all required fields' });
        }
      
        // Optional: Validate the image URL (you can also use a regex for better validation)
        const isValidImageUrl = (url) => {
          const pattern = /^(http(s)?:\/\/.*\.(?:png|jpg|jpeg|gif|bmp|webp))$/i;
          return pattern.test(url);
        };
      
        if (!isValidImageUrl(image)) {
          return res.status(400).json({ error: 'Please provide a valid image URL' });
        }
      
        const sql = "INSERT INTO add_product (name, price, category, type, image) VALUES ( ?, ?, ?, ?, ?)";
        
        // Log the received data for debugging (can be removed later)
        //console.log("Received data:", req.body);
      
        db.query(sql, [name, price, cat, type, image], (err, data) => {
          if (err) {
            console.error("Error inserting data into database:", err);
            return res.status(500).json({ error: 'Error inserting data into database' });
          }
      
          // Check if the insertion was successful (affectedRows should be > 0)
          if (data.affectedRows > 0) {
            return res.json({ message: 'Data Saved Successfully' });
          } else {
            return res.json({ message: 'No Record Inserted' });
          }
        });
      ;
}