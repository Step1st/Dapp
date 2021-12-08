pragma solidity >=0.8.9;

contract Deal {
  address public owner;

  struct Order {
    address buyer;
    uint product;
    uint amount;
    uint ordersid;
  }

  constructor() public {
    owner = msg.sender;
  }

  mapping (uint => Order) orders;

  uint orders_size;

  event OrderSent(address buyer, uint product, uint amount, uint orderid);

  function sendOrder(uint product, uint amount) public {

    orders[orders_size] = Order(msg.sender, product, amount, orders_size++);

    emit OrderSent(msg.sender, product, amount, orders_size);
  }

  

}
