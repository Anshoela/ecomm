import React from 'react'
import './shop.css'
import { FaHeart, FaEye } from 'react-icons/fa';
import { FiFilter } from 'react-icons/fi';

const Shop = ({shop , Filter , allcatefilter , addtocart}) =>
{
  return (
    <>
    <div className='shop'>
        <h2># Shop</h2>
        <p>Home . shop</p>
        <div className='container'>
            <div className='left_box'>
                <div className='category'>
                    <div className='header'>
                        <h3>All categories</h3>
                    </div>
                    <div className='box'>
                        <ul>
                            <li onClick={() => allcatefilter ()}>#All</li>
                            <li onClick={() => Filter ("Home Decor")}># Home decor</li>
                            <li onClick={() => Filter ("Electronics")}># Electronics</li>
                            <li onClick={() => Filter ("Clothes")}># Clothes</li>

                        </ul>
                    </div>
                </div>
                <div className='banner'>
                    <div className='img_box'>
                        <img src='image/2.png' alt=''></img>
                    </div>
                </div>
            </div>
            <div className='right_box'>
                <div className='banner'>
                    <div className='img_box'>
                        <img src ='image/3.jpeg' alt=''></img>
                    </div>
                </div>
                <div className='product_box'>
                    <h2>Shop Product</h2>
                    <div className='product_container'>
                        {
                            shop.map((curElm) =>
                            {
                                return (
                                    <>
                                    <div className='box'>
                                        <div className='img_box'>
                                            <img src={curElm.image} alt=''></img>
                                            <div className='icon'>
                                            <li><FaHeart /></li>
                                            <li><FaEye /></li>
                                            </div>
                                        </div>
                                        <div className='detail'>
                                            <h3>{curElm.Name}</h3>
                                            <p> $ {curElm.price}</p>
                                            <button onClick={() =>addtocart (curElm)}>Add To Cart</button>
                                        </div>
                                    </div>
                                    </>
                                )
                            })
                        }   
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>
  )
}

export default Shop