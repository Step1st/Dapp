// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

contract Deal {
  address public owner;

  struct Shipment {
    address courier;
    uint price;
  }

  struct Order {
    address buyer;
    uint orderid;
    string product;
    uint price;
    Shipment shipment;

    bool init;
  }

  constructor() {
    owner = msg.sender;
  }

  mapping (uint => Order) orders;

  uint orders_size;

  event orderSent(address buyer, uint orderid, string product);
  event orderApproved(address buyer, uint orderid);
  event shipmentAdded(address buyer, uint orderid);
  event orderDelivered(address buyer, uint orderid);

  function sendOrder(string memory product) external  {

    orders[orders_size] = Order(msg.sender, orders_size, product, 0, Shipment(address(0), 0), false);

    emit orderSent(msg.sender, orders_size, product);
    orders_size++;
  }

  function initOrder(uint orderid) external {
    require(msg.sender == owner);

    orders[orderid].init = true;

    emit orderApproved(orders[orderid].buyer, orderid);
  }

  function addShipment(uint orderid, address _courier, uint price) external {
    require(msg.sender == owner);
    require(orders[orderid].init);

    orders[orderid].shipment = Shipment(_courier, price);

    emit shipmentAdded(orders[orderid].buyer, orderid);
  }

  function delivered(uint orderid) external payable {
    require(msg.sender == orders[orderid].shipment.courier);
    require(orders[orderid].init);

    emit orderDelivered(orders[orderid].buyer, orderid);

    payable(owner).transfer(orders[orderid].price);

    payable(orders[orderid].shipment.courier).transfer(orders[orderid].shipment.price);
  }

  // function queryOrder() external pure returns (uint, string memory, uint){

  // }

}
