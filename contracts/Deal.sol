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
    uint ordersid;
    uint product;
    uint price;

    bool init;
  }

  constructor() {
    owner = msg.sender;
  }

  mapping (uint => Order) orders;

  uint orders_size;

  event orderSent(address buyer, uint orderid, uint product, uint price);
  event orderApproved(uint orderid);

  function sendOrder(uint _product, uint _price) external payable {

    orders[orders_size] = Order(msg.sender, orders_size++, _product, _price, false);

    emit orderSent(msg.sender, orders_size, _product, _price);
  }

  function initOrder(uint _orderid) external {
    require(msg.sender == owner);

    orders[_orderid].init = true;

    emit orderApproved(_orderid);
  }

  function addShipment() {

  }

}
