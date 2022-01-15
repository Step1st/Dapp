async function fetchDeal() {
  const response = await fetch('../../build/contracts/Deal.json');
  return response.json();
}
const getWeb3 = () =>
 new Promise((resolve, reject) => {
   // Wait for loading completion to avoid race conditions with web3 injection timing.
   window.addEventListener("load", async () => {
     // Modern dapp browsers...
     if (window.ethereum) {
       const web3 = new Web3(window.ethereum);
       try {
         // Request account access if needed
         await window.ethereum.enable();
         // Accounts now exposed
         resolve(web3);
       } catch (error) {
         reject(error);
       }
     }
     // Legacy dapp browsers...
     else if (window.web3) {
       // Use Mist/MetaMask's provider.
       const web3 = window.web3;
       console.log("Injected web3 detected.");
       resolve(web3);
     }
     // Fallback to localhost; use dev console port by default...
     else {
       const provider = new Web3.providers.HttpProvider(
         "http://127.0.0.1:7545"
       );
       const web3 = new Web3(provider);
       console.log("No web3 instance injected, using Local web3.");
       resolve(web3);
     }
   });
});


const web3 = await getWeb3();
const DealJson = await fetchDeal();
const netId = await web3.eth.net.getId();
const deployedNetwork = DealJson.networks[netId];
const accounts = await web3.eth.getAccounts();
const Deal = new web3.eth.Contract(DealJson.abi, deployedNetwork.address, {from: accounts[0]});
web3.eth.transactionPollingTimeout = 31536000;
// console.log(web3.eth.transactionPollingTimeout)
console.log(web3)
let orders = new Array()
let hashtxset = new Set()

loadOrders();



var orderSentEmiter = Deal.events.orderSent( (error, event) => {
  if (error) {
    console.log(error)
    return
  }
  if (hashtxset.has(event.transactionHash)) {
    return
  }
  $('#table').append( 
    $(`<div class="tr ${event.returnValues.orderid}"> <span class="td orderid">${event.returnValues.orderid}</span> <span class="td product">${event.returnValues.product}</span> <span class="td buyer">${event.returnValues.buyer}</span> <span class="td button"><button class="btn approve-button">Approve</button> <button class="btn deny-button">Deny</button></span> </div>`));
    $('.approve-button').unbind('click').click(approve);
    $('.deny-button').unbind('click').click(deny);
    orders.push($(`.tr.${event.returnValues.orderid}`)[0].outerHTML)
    localStorage.setItem(`orders`, JSON.stringify(orders))
    let txhash = event.transactionHash;
    hashtxset.add(txhash)
});

var orderApprovedEmiter = Deal.events.orderApproved( (error, event) => {
  if (error) {
    console.log(error)
    return
  }
  if (hashtxset.has(event.transactionHash)) {
    return
  }
  $(`.${event.returnValues.orderid} > .button > .approve-button`).prop('disabled', true)
  $(`.${event.returnValues.orderid} > .button > .btn`).remove()
  $(`.${event.returnValues.orderid} > .button`).append($('<p class="approved">Approved &#10004;<p>'))
  orders[event.returnValues.orderid-1] = $(`.tr.${event.returnValues.orderid}`)[0].outerHTML;
  localStorage.setItem(`orders`, JSON.stringify(orders))
  let txhash = event.transactionHash
  hashtxset.add(txhash)
})

var orderDeniedEmiter = Deal.events.orderDenied( (error, event) => {
  if (error) {
    console.log(error)
    return
  }
  if (hashtxset.has(event.transactionHash)) {
    return
  }
  $(`.${event.returnValues.orderid} > .button > .approve-button`).prop('disabled', true)
  $(`.${event.returnValues.orderid} > .button > .btn`).remove()
  $(`.${event.returnValues.orderid} > .button`).append($('<p class="denied">Denied &#x2718;<p>'))
  orders[event.returnValues.orderid-1] = $(`.tr.${event.returnValues.orderid}`)[0].outerHTML;
  localStorage.setItem(`orders`, JSON.stringify(orders))
  let txhash = event.transactionHash
  hashtxset.add(txhash)
})

$('.shipment-button').click(() => {
  let shipment = {
    orderid: $('#orderid').val(),
    courier: $('#address').val(),
    product_price: web3.utils.toWei(`${$('#product_price').val()}`),
    shipping_price: web3.utils.toWei(`${$('#shipment_price').val()}`)
  }
  Deal.methods.addShipment(shipment.orderid, shipment.courier, `${shipment.product_price}`, `${shipment.shipping_price}`).send()
}) 

function loadOrders(){
  orders = JSON.parse(localStorage.getItem('orders'));
  if (orders == null) {
    orders = new Array()
    return
  }
  for (let index = 0; index < orders.length; index++) {
    $('#table').append($(orders[index]));
  }
  $('.approve-button').click(approve);
  $('.deny-button').click(deny);
}

function approve(event) {
  let orderid = event.currentTarget.parentElement.parentElement.children[0].innerHTML
  Deal.methods.initOrder(orderid).send();
  $(`.${orderid} > .button > .approve-button`).prop('disabled', true)
}

function deny(event) {
  let orderid = event.currentTarget.parentElement.parentElement.children[0].innerHTML
  Deal.methods.denyOrder(orderid).send();
  $(`.${orderid} > .button > .deny-button`).prop('disabled', true)
}
  