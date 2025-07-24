import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaMinus, FaPlus, FaStar } from "react-icons/fa";

const menuItems = {
  snacks: [
    { id: 1, name: "Bhel Puri", price: 60, img: "https://vegecravings.com/wp-content/uploads/2018/06/Bhel-Puri-Recipe-Step-By-Step-Instructions-500x500.jpg", description: "Crispy puffed rice mixed with veggies and chutneys.", rating: 4.5 },
    { id: 2, name: "Dahi Puri", price: 70, img: "https://www.indianveggiedelight.com/wp-content/uploads/2023/07/dahi-puri-featured.jpg", description: "Crispy puris filled with yogurt, chutney, and spices.", rating: 4.6 },
    { id: 3, name: "Vada Pav", price: 40, img: "https://blog.swiggy.com/wp-content/uploads/2024/11/Image-1_mumbai-vada-pav-1024x538.png", description: "Spicy potato fritter sandwiched in a bun.", rating: 4.4 },
    { id: 4, name: "Samosa", price: 30, img: "https://www.samosa-recipe.com/wp-content/uploads/2019/01/aloo-samosa.jpg", description: "Deep-fried pastry filled with spiced potatoes and peas.", rating: 4.3 },
    { id: 5, name: "Masala Papad", price: 35, img: "https://live.staticflickr.com/8494/8306784266_ff487d019e_b.jpg", description: "Crunchy papad topped with spicy onion-tomato mix.", rating: 4.1 },
    { id: 6, name: "Corn Chaat", price: 50, img: "https://www.indianveggiedelight.com/wp-content/uploads/2017/03/sweet-corn-bhel-featured.jpg", description: "Tangy and spicy corn salad snack.", rating: 4.2 },
    { id: 7, name: "Aloo Tikki", price: 45, img: "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/09/aloo-tikki-recipe.webp", description: "Crispy potato patties with spicy chutney.", rating: 4.3 },
  ],
  veg: [
    { id: 8, name: "Paneer Butter Masala", price: 280, img: "https://www.ruchiskitchen.com/wp-content/uploads/2020/12/Paneer-butter-masala-recipe-3.jpg.webp", description: "A rich and creamy paneer dish, perfect with naan.", rating: 4.5 },
    { id: 9, name: "Rajma Chawal", price: 180, img: "https://www.vegrecipesofindia.com/wp-content/uploads/2021/05/rajma-recipe-1-500x500.jpg", description: "Classic kidney beans curry served with aromatic rice.", rating: 4.0 },
    { id: 10, name: "Mix Veg Curry", price: 220, img: "https://shwetainthekitchen.com/wp-content/uploads/2023/03/mixed-vegetable-curry.jpg", description: "Assorted vegetables cooked in a flavorful gravy.", rating: 3.8 },
    { id: 11, name: "Dal Makhani", price: 200, img: "https://shwetainthekitchen.com/wp-content/uploads/2019/11/IMG_6917_1-scaled.jpg", description: "Creamy black lentil curry, a North Indian delight.", rating: 4.7 },
    { id: 12, name: "Chole Bhature", price: 150, img: "https://things2.do/blogs/wp-content/uploads/2024/07/image-16.jpeg", description: "Spicy chickpea curry served with fluffy fried bread.", rating: 4.2 },
    { id: 13, name: "Mushroom Masala", price: 150, img: "https://static.toiimg.com/thumb/75534551.cms?width=800&height=800&imgsize=2437474", description: "Mushrooms cooked in a spicy and creamy masala gravy.", rating: 4.2 },
  ],
  nonVeg: [
    { id: 14, name: "Chicken Biryani", price: 300, img: "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/12/chicken-biryani-recipe.jpg", description: "Fragrant basmati rice cooked with tender chicken and spices.", rating: 4.6 },
    { id: 15, name: "Mutton Rogan Josh", price: 400, img: "https://www.chefkunalkapur.com/wp-content/uploads/2021/03/Mutton-Roganjosh-1300x867.jpg?v=1620401698", description: "A rich Kashmiri lamb curry, slow-cooked to perfection.", rating: 4.8 },
    { id: 16, name: "Butter Chicken", price: 320, img: "https://www.chefkunalkapur.com/wp-content/uploads/2021/03/Butter-Chicken-1300x730.jpg?v=1619499056", description: "Succulent chicken in a buttery tomato gravy, a crowd favorite.", rating: 4.9 },
    { id: 17, name: "Fish Curry", price: 350, img: "https://www.chefkunalkapur.com/wp-content/uploads/2021/03/Coastal-Fish-Curry-1300x867.jpg?v=1621600571", description: "Spicy coastal fish curry with tangy flavors.", rating: 4.1 },
    { id: 18, name: "Egg Curry", price: 180, img: "https://www.chefkunalkapur.com/wp-content/uploads/2021/03/Egg-Curry-867x1300.jpg?v=1619497472", description: "Boiled eggs cooked in a flavorful, spicy gravy.", rating: 3.9 },
    { id: 19, name: "Chicken Tikka", price: 180, img: "https://www.seriouseats.com/thmb/DbQHUK2yNCALBnZE-H1M2AKLkok=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/chicken-tikka-masala-for-the-grill-recipe-hero-2_1-cb493f49e30140efbffec162d5f2d1d7.JPG", description: "Marinated chicken pieces grilled to perfection.", rating: 4.3 },
  ],
  roti: [
    { id: 20, name: "Tandoori Roti", price: 30, img: "https://www.cookwithmanali.com/wp-content/uploads/2021/07/Tandoori-Roti-500x500.jpg", description: "Whole wheat bread baked in a clay oven.", rating: 4.1 },
    { id: 21, name: "Butter Naan", price: 50, img: "https://www.chefkunalkapur.com/wp-content/uploads/2021/03/Naan.jpg?v=1621945508", description: "Soft, leavened flatbread brushed with butter.", rating: 4.5 },
    { id: 22, name: "Missi Roti", price: 40, img: "https://maharajaroyaldining.com/wp-content/uploads/2024/05/Missi-Roti-1.webp", description: "Flatbread made from gram flour and wheat flour, spiced.", rating: 3.7 },
    { id: 23, name: "Lachha Paratha", price: 60, img: "https://curlytales.com/wp-content/uploads/2022/07/Untitled-design-2022-07-12T175556.803.jpg", description: "Multi-layered flaky Indian bread.", rating: 4.0 },
    { id: 24, name: "Stuffed Kulcha", price: 70, img: "https://aromamulticuisinerestaurant.com/wp-content/uploads/2024/02/Aloo-Masala-Kulcha.webp", description: "Leavened bread stuffed with spiced potatoes or paneer.", rating: 4.2 },
    { id: 25, name: "Plain Roti", price: 20, img: "https://www.simplyrecipes.com/thmb/kfKdjryQIBH-MkGQXqN9mSfu-Yc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/Simply-Recipes-Roti-LEAD-3-38a1295fbb884aaabd42a34bcad9ea82.jpg", description: "Simple unleavened whole wheat flatbread.", rating: 4.0 },
  ],
  desserts: [
    { id: 26, name: "Gulab Jamun", price: 80, img: "https://www.chefkunalkapur.com/wp-content/uploads/2021/03/Gulab-Jamun-2-1300x891.jpg?v=1619317286", description: "Soft, spongy milk-solids balls soaked in rose-flavored syrup.", rating: 4.7 },
    { id: 27, name: "Rasgulla", price: 100, img: "https://www.chefkunalkapur.com/wp-content/uploads/2021/03/Sandesh-1300x867.jpg?v=1619103410", description: "Spongy cottage cheese balls in light sugar syrup.", rating: 4.3 },
    { id: 28, name: "Kesar Malai Kulfi", price: 150, img: "https://www.chefkunalkapur.com/wp-content/uploads/2021/03/Malai-Kulfi--1300x867.jpeg?v=1621617796", description: "Creamy Indian ice cream flavored with saffron and cardamom.", rating: 4.6 },
    { id: 29, name: "Jalebi", price: 80, img: "https://www.chefkunalkapur.com/wp-content/uploads/2021/03/Jalebi.jpg?v=1620718109", description: "Crispy, sweet, and syrupy coiled fried dough.", rating: 4.0 },
    { id: 30, name: "Rabri", price: 160, img: "https://www.chefkunalkapur.com/wp-content/uploads/2024/06/023A2495-1300x731.jpg?v=1718420958", description: "Sweetened condensed milk dessert, often garnished with nuts.", rating: 4.4 },
    { id: 31, name: "Ice Cream", price: 100, img: "https://www.allrecipes.com/thmb/zvB79rMNWcVQhI3aHEx6ZDffdQQ=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/AR-20988-Fried-Ice-Cream-DDMFS-4x3-bac5a4a2800b4ff5a308c59bc3bae17a.jpg", description: "Creamy frozen dessert in various flavors.", rating: 4.4 },
  ],
  drinks: [
    { id: 32, name: "Mineral Water", price: 20, img: "https://5.imimg.com/data5/WX/JN/ZU/SELLER-6060390/250-ml-bisleri-packaged-drinking-water-500x500.jpg", description: "Pure and refreshing bottled mineral water.", rating: 4.0 },
    { id: 33, name: "Coke", price: 40, img: "https://cdn.uengage.io/uploads/5/image-481927-1711711572.jpeg", description: "Classic Coca-Cola soft drink.", rating: 4.2 },
    { id: 34, name: "Thums Up", price: 40, img: "https://www.bbassets.com/media/uploads/p/xl/251014_12-thums-up-soft-drink.jpg", description: "Strong and fizzy cola drink.", rating: 4.3 },
    { id: 35, name: "Sprite", price: 40, img: "https://m.media-amazon.com/images/I/71doy6em4jL.jpg", description: "Lemon-lime flavored refreshing soda.", rating: 4.1 },
    { id: 36, name: "Fanta", price: 40, img: "https://5.imimg.com/data5/SELLER/Default/2021/11/VZ/UG/HY/51865166/new-product.jpeg", description: "Orange-flavored fizzy beverage.", rating: 4.0 },
    { id: 37, name: "Lassi", price: 40, img: "https://www.indianveggiedelight.com/wp-content/uploads/2023/01/sweet-lassi-recipe-featured.jpg", description: "Refreshing yogurt-based drink, sweet or salty.", rating: 4.5 },
  ],
};

const Menu = () => {
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState([]);

  const handleIncrement = (item) => {
    setSelectedItems((prev) => {
      const found = prev.find((s) => s.id === item.id);
      return found
        ? prev.map((s) => (s.id === item.id ? { ...s, quantity: s.quantity + 1 } : s))
        : [...prev, { ...item, quantity: 1 }];
    });
  };

  const handleDecrement = (item) => {
    setSelectedItems((prev) =>
      prev
        .map((s) => (s.id === item.id ? { ...s, quantity: s.quantity - 1 } : s))
        .filter((s) => s.quantity > 0)
    );
  };

  const handleOrder = () => {
    if (selectedItems.length === 0) {
      const div = document.createElement("div");
      div.innerHTML = `<div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.2); z-index: 9999;">
        <p>Please select at least one item before proceeding!</p>
        <button onclick="this.parentNode.remove()" style="margin-top: 10px; padding: 5px 10px; background-color: #6366F1; color: white; border: none; border-radius: 4px;">OK</button>
      </div>`;
      document.body.appendChild(div);
      return;
    }
    navigate("/ordersummary", { state: { selectedItems } });
  };

  const order = ["snacks", "veg", "nonVeg", "roti", "drinks", "desserts"];

  return (
    <motion.div className="container mx-auto p-6 bg-gray-50 rounded-lg shadow-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-4xl font-bold text-center text-indigo-700 mb-8">📜 Our Delicious Menu</h2>

      {order.map((category) => (
        <div key={category} className="mb-10">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4 capitalize border-b pb-1 border-indigo-300">{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuItems[category].map((item) => {
              const selected = selectedItems.find((i) => i.id === item.id);
              return (
                <motion.div
                  key={item.id}
                  className="flex items-center justify-between bg-white p-4 rounded-lg shadow hover:shadow-md transition"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-start space-x-4">
                    <img src={item.img} alt={item.name} className="w-20 h-20 rounded-md object-cover" />
                    <div>
                      <p className="text-lg font-semibold">{item.name}</p>
                      <p className="text-gray-500 text-sm">{item.price} ₹</p>
                      <p className="text-gray-600 text-sm">{item.description}</p>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <FaStar key={i} className={i < Math.floor(item.rating) ? "text-yellow-400" : "text-gray-300"} />
                        ))}
                        <span className="ml-2 text-sm text-gray-600">({item.rating.toFixed(1)})</span>
                      </div>
                      {selected && <p className="text-gray-700 mt-1">Quantity: {selected.quantity}</p>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selected ? (
                      <>
                        <button onClick={() => handleDecrement(item)} className="bg-red-500 px-2 py-1 rounded text-white">
                          <FaMinus />
                        </button>
                        <span className="text-lg">{selected.quantity}</span>
                        <button onClick={() => handleIncrement(item)} className="bg-green-500 px-2 py-1 rounded text-white">
                          <FaPlus />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => handleIncrement(item)} className="bg-indigo-600 text-white px-4 py-2 rounded-md">
                        Select
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}

      <motion.button
        onClick={handleOrder}
        className="w-full md:w-auto block mx-auto bg-green-600 text-white px-6 py-3 rounded-full text-xl font-semibold hover:bg-green-700 transition mt-6"
        whileHover={{ scale: 1.05 }}
      >
        Proceed to Order 🛒
      </motion.button>
    </motion.div>
  );
};

export default Menu;