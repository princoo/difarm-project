
import React, { useState } from "react";

interface SearchProps {
  itemList: any; 
  setFilteredClient:any
  title:any
}

export default function Search({ itemList,setFilteredClient,title }: SearchProps) {
  
  const [filteredList, setFilteredList] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');

  const filterBySearch = (text: string) => {
    const filtered = itemList.filter((client: any) =>
      client.name.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredList(filtered);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    filterBySearch(event.target.value);
  };

  const handleItemClick = (item: any) => {
   
    setFilteredClient(item)
    setFilteredList([]);
  };

  return (
    <div className="relative  ">
      <div className="search-header">
      <label htmlFor="" className="text-md">{title}</label>
        <input
          className="form-input"
         
          onChange={handleInputChange}
        />
      </div>
      <div id="item-list relative absolute rounded shadow  dark:bg-slate-900 bg-gray-50 z-50">
        <ol>
          {filteredList.map((item: any, index: number) => (
            <li key={index} onClick={() => handleItemClick(item)}>
              {item?.name}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
