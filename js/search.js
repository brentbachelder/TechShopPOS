var searchSelection = -1;
var shiftBeingHeld = false;
var customerShown = [];

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
    console.log("Going to page " + num);
}

function OpenTicketPageFromSearch(num) {
    CloseSearch();
    console.log("Goint to ticket page " + num);
}