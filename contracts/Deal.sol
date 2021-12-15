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
    uint pay;
    Shipment shipment;

    bool init;
    bool payed;
  }

  constructor() {
    owner = msg.sender;
  }

  mapping (uint => Order) orders;

  uint orders_size;

  event orderSent(address buyer, uint orderid, string product, uint price, uint pay, bool init, bool payed);
  event orderApproved(address buyer, uint orderid);
  event shipmentAdded(address buyer, uint orderid);
  event orderDelivered(address buyer, uint orderid);

  function sendOrder(string memory product) external  {

    orders[orders_size] = Order(msg.sender, orders_size, product, 0, 0, Shipment(address(0), 0), false, false);

    emit orderSent(msg.sender, orders_size, product, 0, 0, false, false);
    orders_size++;
  }

  function initOrder(uint orderid) external {
    require(msg.sender == owner);

    orders[orderid].init = true;

    emit orderApproved(orders[orderid].buyer, orderid);
  }

  function sendPay(uint orderid) payable public{
    require(orders[orderid].buyer == msg.sender);

    require(orders[orderid].init);

    orders[orderid].pay = msg.value;

    if(orders[orderid].pay == orders[orderid].price + orders[orderid].shipment.price){
      orders[orderid].payed = true;
    }
  }

  function addShipment(uint orderid, address courier, uint price, uint shipment_price) external {
    require(msg.sender == owner);
    require(orders[orderid].init);

    orders[orderid].price = price;
    orders[orderid].shipment = Shipment(courier, shipment_price);

    emit shipmentAdded(orders[orderid].buyer, orderid);
  }

  function delivered(uint orderid) external payable {
    require(msg.sender == orders[orderid].shipment.courier);
    require(orders[orderid].init);
    require(orders[orderid].payed);

    emit orderDelivered(orders[orderid].buyer, orderid);

    payable(owner).transfer(orders[orderid].price);

    payable(orders[orderid].shipment.courier).transfer(orders[orderid].shipment.price);
  }

  function queryOrder(uint _orderid) external view returns (address buyer, uint orderid, string memory product, uint price, uint pay, bool init, bool payed){
    return (orders[_orderid].buyer, orders[_orderid].orderid, orders[_orderid].product, (orders[_orderid].price + orders[_orderid].shipment.price), orders[_orderid].pay, orders[_orderid].init, orders[_orderid].payed);  
  }

}
