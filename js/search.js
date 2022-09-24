var searchSelection = -1;
var searchSelectionNT = -1
var shiftBeingHeld = false;
var customerShown = [];
var customerShownNT = [];

// Open and close Search Page
function ClickToCloseSearch(event) {
    if(event.target.id == "search-customer-page"  || event.target.id == "x-out")  CloseSearch();
}

function OpenSearch(gotoTicket = false) {
    document.getElementById("search-customer-page").classList.remove("hidden");
    if(!gotoTicket) {
        document.getElementById("search-customer-container").classList.remove("hidden");
        document.getElementById("customer-input").focus();
    }
    else {
        document.getElementById("no-ticket-found").classList.add("hidden");
        document.getElementById("goto-ticket-container").classList.remove("hidden");
        document.getElementById("ticket-input").focus();
    }
}

function CloseSearch() {
    searchSelection = -1;
    ClearSearchSelection();
    document.getElementById("customer-input").value = "";
    document.getElementById("ticket-input").value = "";
    document.getElementById("search-results").innerHTML = "";
    document.getElementById("search-customer-container").classList.add("hidden");
    document.getElementById("goto-ticket-container").classList.add("hidden");
    document.getElementById("search-customer-page").classList.add("hidden");
}



// Create and Draw the customer list
function SearchForCustomer(event) {
    if(event.keyCode != 40 && event.keyCode != 38) {
        var currentInput = document.getElementById("customer-input").value.toLowerCase();
        currentInput = currentInput.replace(/[^A-Z0-9]/ig, "");
        var list = {};
        var listCount = 0;

        if(currentInput.length > 0) { // Change to 2 after testing
            for(var key in CustomerSearch) {
                var name = CustomerSearch[key].Name.toLowerCase();
                name = name.replace(/[^A-Z0-9]/ig, "");
                var phone = CustomerSearch[key].Phone;
                phone = phone.replace(/[^A-Z0-9]/ig, "");
                if((name.indexOf(currentInput) != -1 || phone.indexOf(currentInput) != -1) && listCount < 4) {
                    list[key] = CustomerSearch[key];
                    listCount++;
                }
            }
            CreateCustomerList(list);
        }
        else document.getElementById('search-results').innerHTML = '';
    }
}

function CreateCustomerList(list) {
    customerShown = [];
    document.getElementById('search-results').innerHTML = '';
    var content = '';
    var i = 0;
    console.log("being drawn");
    for(var key in list) {
        var selected = '';
        if(i == searchSelection) selected = ' selected';
        content += `
        <div id="ss-${i}" class="result-container${selected}" onmouseenter="SetSearchSelection(${i})" onclick="OpenCustomerPageFromSearch(${key})">
            <div class="name">${list[key].Name}</div>
            <div class="phone">${list[key].Phone}</div>
        </div>
        `;
        customerShown[i] = key;
        i++;
    }
    document.getElementById('search-results').innerHTML = content;
}



// Set and Clear the selected search option
function SetSearchSelection(num) {
    searchSelection = num;
    console.log(searchSelection);
    ClearSearchSelection();
    if(num < customerShown.length && num >= 0) document.getElementById("ss-" + num).classList.add("selected");
}

function ClearSearchSelection() {
    var results = document.getElementById("search-results").getElementsByClassName("result-container");
    for(var i = 0; i < results.length; i++) results[i].classList.remove("selected");
}



// Search keyboard functions
function SearchKeyboardActions(event) {
    if(customerShown.length > 0) {
        var key = event.keyCode;
        if(key == 40 || (key == 9 && !shiftBeingHeld)) {
            event.preventDefault();
            if(searchSelection == -1 || searchSelection == customerShown.length) searchSelection = 0;
            else searchSelection += 1;
        }
        else if(key == 38 || (key == 9 && shiftBeingHeld)) {
            event.preventDefault();
            if(searchSelection == -1 || searchSelection == customerShown.length) searchSelection = customerShown.length - 1;
            else searchSelection -= 1;
        }
        else if(key == 27) {
            CloseSearch();
            return;
        }
        else if(key == 13) {
            if(searchSelection >= 0 && searchSelection <= customerShown.length) OpenCustomerPageFromSearch(customerShown[searchSelection]);
        }
        else if(key == 16) shiftBeingHeld = true;
        else searchSelection = -1;
        SetSearchSelection(searchSelection);
    }
}

function IsShiftHeld(event) {
    if(event.keyCode == 16) shiftBeingHeld = false;
}



// Ticket keyboard functions
function TicketKeyboardActions(event) {
    if(event.keyCode == 13) {
        CheckTicketResult();
    }
    else document.getElementById("no-ticket-found").classList.add("hidden");
}



// Check Ticket result
function CheckTicketResult() {
    var input = document.getElementById("ticket-input").value;
    var success = false;

    for(var i = 0; i < TicketSearch.length; i++) {
        if(input == TicketSearch[i]) {
            OpenTicketPageFromSearch(TicketSearch[i]);
            success = true;
        }
    }

    if(!success) {
        document.getElementById("ticket-input").value = '';
        document.getElementById("no-ticket-found").classList.remove("hidden");
    }
}



// Go to the page from results
function OpenCustomerPageFromSearch(num) {
    CloseSearch();
    var url = window.location.toString();
    url = url.split('#')[0];
    location.href = url + '#customer-' + num;
}

function OpenTicketPageFromSearch(num) {
    CloseSearch();
    var url = window.location.toString();
    url = url.split('#')[0];
    location.href = url + '#ticket-' + num;
}







// NEW TICKET CUSTOMER SEARCH
// Create and Draw the customer list
function SearchForCustomerNT(event) {
    if(event.keyCode != 40 && event.keyCode != 38 && event.keyCode != 27 && event.keyCode != 13) {
        var currentInput = document.getElementById(nameInputId).value.toLowerCase();
        currentInput = currentInput.replace(/[^A-Z0-9]/ig, "");
        var list = {};
        var listCount = 0;

        if(currentInput.length > 0) { // Change to 2 after testing
            for(var key in CustomerSearch) {
                var name = CustomerSearch[key].Name.toLowerCase();
                name = name.replace(/[^A-Z0-9]/ig, "");
                if(name.indexOf(currentInput) != -1 && listCount < 4) {
                    list[key] = CustomerSearch[key];
                    listCount++;
                }
            }
            CreateCustomerListNT(list);
        }
        else document.getElementById(nameInputId).innerHTML = '';
    }
}

function CreateCustomerListNT(list) {
    customerShownNT = [];
    document.getElementById("new-ticket-search-results").innerHTML = '';
    var content = '';
    var i = 0;
    for(var key in list) {
        var selected = '';
        if(i == searchSelectionNT) selected = ' selected';
        content += `
        <div id="nts-${i}" class="new-ticket-search-result${selected}" onmouseenter="SetSearchSelectionNT(${i})" onmousedown="SelectNewTicketCustomer(${key})">${list[key].Name}</div>
        `;
        customerShownNT[i] = key;
        i++;
    }
    document.getElementById('new-ticket-search-results').innerHTML = content;
}

// Search keyboard functions
function SearchKeyboardActionsNT(event) {
    if(customerShownNT.length > 0) {
        var key = event.keyCode;
        if(key == 40) {
            event.preventDefault();
            if(searchSelectionNT == -1 || searchSelectionNT == customerShownNT.length) searchSelectionNT = 0;
            else searchSelectionNT += 1;
        }
        else if(key == 38) {
            event.preventDefault();
            if(searchSelectionNT == -1 || searchSelectionNT == customerShownNT.length) searchSelectionNT = customerShownNT.length - 1;
            else searchSelectionNT -= 1;
        }
        else if(key == 27) {
            CloseSearchNT();
            return;
        }
        else if(key == 13) {
            if(searchSelectionNT >= 0 && searchSelectionNT <= customerShownNT.length) {
                SelectNewTicketCustomer(customerShownNT[searchSelectionNT]);
                document.getElementById(nameInputId).blur();
            }
        }
        else searchSelectionNT = -1;
        SetSearchSelectionNT(searchSelectionNT);
    }
}

// Set, Clear, and Close the search results
function SetSearchSelectionNT(num) {
    searchSelectionNT = num;
    ClearSearchSelectionNT();
    if(num < customerShownNT.length && num >= 0) document.getElementById("nts-" + num).classList.add("selected");
}

function ClearSearchSelectionNT() {
    var results = document.getElementById("new-ticket-search-results").getElementsByClassName("new-ticket-search-result");
    for(var i = 0; i < results.length; i++) results[i].classList.remove("selected");
}

function CloseSearchNT() {
    searchSelectionNT = -1;
    ClearSearchSelectionNT();
    document.getElementById("new-ticket-search-results").innerHTML = '';
}

