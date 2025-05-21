import React, { useContext } from 'react'
import './FoodDisplay.css'
import FoodItem from '../FoodItem/FoodItem'
import { StoreContext } from '../../context/StoreContext'

const FoodDisplay = ({category}) => {
  const {food_list} = useContext(StoreContext);

  return (
    <div className='food-display' id='food-display'>
      <h2>Top dishes near you</h2>
      <div className='food-display-list'>
        {food_list.map((item)=>{
          // Assuming item.category is an object like { id: 1, name: "Salad" }
          // And category prop is a string like "Salad"
          if (category === "All" || category === item.category?.name) { // Safely access item.category.name
            return <FoodItem key={item.id} image={item.image} name={item.name} desc={item.description} price={item.price} id={item.id}/>
          }
          return null;
        })}
      </div>
    </div>
  )
}
export default FoodDisplay