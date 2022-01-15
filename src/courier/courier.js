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
  let shipments = new Array()
  let hashtxset = new Set()
  
  loadOrders();
  
  
  
  var shipmentAddedEmiter = Deal.events.shipmentAdded({filter: {courier: accounts[0]}}, (error, event) => {
    if (error) {
      console.log(error)
      return
    }
    if (hashtxset.has(event.transactionHash)) {
      return
    }
    $('#table').append( 
      $(`<div class="tr ${event.returnValues.orderid}"> <span class="td orderid">${event.returnValues.orderid}</span> <span class="td product">${event.returnValues.product}</span> <span class="td buyer">${event.returnValues.buyer}</span> <span class="td button"> <button class="btn">Delivered</button> </div>`));
      $('.btn').unbind('click').click(delivered);
      shipments.push($(`.tr.${event.returnValues.orderid}`)[0].outerHTML)
      localStorage.setItem(`shipments`, JSON.stringify(shipments))
      let txhash = event.transactionHash
      hashtxset.add(txhash)
  });
  
  var orderDeliveredEmiter = Deal.events.orderDelivered( (error, event) => {
    if (error) {
      console.log(error)
      return
    }
    if (hashtxset.has(event.transactionHash)) {
      return
    }
    $(`.${event.returnValues.orderid} > .button > .btn`).prop('disabled', true)
    $(`.${event.returnValues.orderid} > .button > .btn`).remove()
    $(`.${event.returnValues.orderid} > .button`).append($('<p class="approved">Delivered &#10004;<p>'))
    shipments[event.returnValues.orderid-1] = $(`.tr.${event.returnValues.orderid}`)[0].outerHTML;
    localStorage.setItem(`shipments`, JSON.stringify(shipments))
    let txhash = event.transactionHash
    hashtxset.add(txhash)
  })
  
  
  function loadOrders(){
    shipments = JSON.parse(localStorage.getItem('shipments'));
    if (shipments == null) {
      shipments = new Array()
      return
    }
    for (let index = 0; index < shipments.length; index++) {
      $('#table').append($(shipments[index]));
    }
    $('.btn').click(delivered);
  }
  
  function delivered(event) {
    let orderid = event.currentTarget.parentElement.parentElement.children[0].innerHTML
    Deal.methods.delivered(event.currentTarget.parentElement.parentElement.children[0].innerHTML).send();
    $(`.${orderid} > .button > .btn`).prop('disabled', true)
  }