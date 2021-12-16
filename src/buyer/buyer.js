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

$('#accAdress').html(`${accounts[0]}`)

var eventemitter = Deal.events.orderSent({filter: {buyer: accounts[0]}}, (error, event) => {
  $('#orderid').html(event.returnValues.orderid);
  $('#product').html(event.returnValues.product);
  $('#price').html(web3.utils.fromWei(event.returnValues.price, 'ether') + 'Eth');
  $('#pay').html(web3.utils.fromWei(event.returnValues.pay, 'ether') + 'Eth');
  $('#init').html(event.returnValues.init ? 'Approved' : 'NotApproved');
  $('#payed').html(event.returnValues.payed ? 'Yes' : 'No')
});

var eventemitter2 = Deal.events.orderPayed({filter: {buyer: accounts[0]}}, (error, event) => {
  $('#orderid').html(event.returnValues.orderid);
  $('#product').html(event.returnValues.product);
  $('#price').html(web3.utils.fromWei(event.returnValues.price, 'ether') + 'Eth');
  $('#pay').html(web3.utils.fromWei(event.returnValues.pay, 'ether') + 'Eth');
  $('#init').html(event.returnValues.init ? 'Approved' : 'NotApproved');
  $('#payed').html(event.returnValues.payed ? 'Yes' : 'No')
});

$('#expandMenu').click(() =>{
  if($('#expandMenu').css('transform') == 'matrix(-1, 0, 0, -1, 0, 0)'){
    $('#expandMenu').css('transform', 'none')
    $('.functionBar').css('height', '5%')
    $('.functionBar div').css('height', '0%')
    return
  }
  $('#expandMenu').css('transform', 'rotate(180deg)')
  $('.functionBar').css('height', '65%')
  $('.functionBar div').css('height', '100%')
})

$('.order-button').click((event) =>{
  Deal.methods.sendOrder(`${event.currentTarget.parentElement.children[0].innerHTML}`).send();
})

$('#check-button').click( async () => {
  let val = $('#check-orderid').val()
  if (typeof val == 'undefined' || val <= 0) {
    return
  }
  const order = await Deal.methods.queryOrder(val).call();
  $('#orderid').html(order.orderid);
  $('#product').html(order.product);
  $('#price').html(web3.utils.fromWei(order.price, 'ether') + 'Eth');
  $('#pay').html((web3.utils.fromWei(order.pay, 'ether')) + 'Eth');
  $('#init').html(order.init ? 'Approved' : 'NotApproved');
  $('#payed').html(order.payed ? 'Yes' : 'No')
})

$('#pay-button').click( () => {
  let val = $('#check-orderid').val()
  if (typeof val == 'undefined' || val <= 0 || $('#payed').html() == 'Yes' || $('#init').html() == 'NotApproved' || parseFloat($('#price').html()) == 0 || $('#product').html() == '') {
    alert("You can't pay for this order")
    return
  }
  Deal.methods.sendPay(val).send({value: `${web3.utils.toWei($('#ether').val())}`});
})
