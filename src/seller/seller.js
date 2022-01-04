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
let selectedOrder = {
  orderid: undefined,
  product: undefined,
  buyer: undefined,
};


var orderSentEmiter = Deal.events.orderSent( (error, event) => {
  $('#table').append( 
    $(`<div class="tr ${event.returnValues.orderid}"> <span class="td orderid">${event.returnValues.orderid}</span> <span class="td product">${event.returnValues.product}</span> <span class="td buyer">${event.returnValues.buyer}</span> <span class="td button"><button class="btn approve-button">Approve</button> <button class="btn deny-button">Deny</button></span> </div>`));
    $('.approve-button').click(approve);
    $('.deny-button').click(deny);
    // $('.tr').click(select);
    localStorage.setItem(`order${event.returnValues.orderid}`, $(`.tr.${event.returnValues.orderid}`)[0].outerHTML)
});

var orderApprovedEmiter = Deal.events.orderApproved( (error, event) => {
  $(`.${event.returnValues.orderid} > .button > .approve-button`).prop('disabled', true)
  $(`.${event.returnValues.orderid} > .button > .btn`).remove()
  $(`.${event.returnValues.orderid} > .button`).append($('<p class="approved">Approved &#10004;<p>'))
  localStorage.setItem(`order${event.returnValues.orderid}`, $(`.tr.${event.returnValues.orderid}`)[0].outerHTML)
})

var orderDeniedEmiter = Deal.events.orderDenied( (error, event) => {
  $(`.${event.returnValues.orderid} > .button > .approve-button`).prop('disabled', true)
  $(`.${event.returnValues.orderid} > .button > .btn`).remove()
  $(`.${event.returnValues.orderid} > .button`).append($('<p class="denied">Denied &#x2718;<p>'))
  localStorage.setItem(`order${event.returnValues.orderid}`, $(`.tr.${event.returnValues.orderid}`)[0].outerHTML)
})

loadOrders();

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
  for (let index = localStorage.length -1; index >= 0; index--) {
    $('#table').append(localStorage.getItem(localStorage.key(index)));
  }
  $('.approve-button').click(approve);
  $('.deny-button').click(deny);
  // $('.tr').click(select);
}


// function select(){
//   $('.tr').removeClass('tr-selected')
//   this.classList.add('tr-selected')
//   selectedOrder.orderid = this.children[0].innerHTML
//   selectedOrder.product = this.children[1].innerHTML
//   selectedOrder.buyer = this.children[2].innerHTML
// }


function approve(event) {
  Deal.methods.initOrder(event.currentTarget.parentElement.parentElement.children[0].innerHTML).send();
}
function deny(event) {
  Deal.methods.denyOrder(event.currentTarget.parentElement.parentElement.children[0].innerHTML).send();
}
  