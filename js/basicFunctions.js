// Variables
var currentPage;
const menu = document.getElementById("menu");

// Listener for page changes
window.addEventListener('hashchange', GetNewHash);

function GetNewHash(event) {
    var newPage = event.newURL.toString();
    newPage = newPage.split("#")[1];
    ChangePage(newPage);
}

// Actual Page Change function
function ChangePage(newPage, pageID = null) {
    if(finishedLoading) {
        if(newPage != currentPage) {
            CloseMenu();

            if(newPage == "customer") InitCustomer("12345");
            else if(newPage == "new-repair") InitNewRepair();
            else if(newPage == "open-tickets") InitOpenTickets();
            else if(newPage == "part-orders") InitPartOrders();
            else if(newPage == "pos") InitPos();
            else if(newPage == "reports") InitReports();
            else if(newPage == "settings") InitSettings();
            else if(newPage == "ticket") InitTicket("12345");
            else InitDashboard();

            var selected = menu.getElementsByClassName("selected");
            for(var i = 0; i < selected.length; i++) selected[i].classList.remove("selected");
            if(["new-repair", "open-tickets", "reports", "pos", "part-orders", "settings"].indexOf(newPage) > -1) document.getElementById(newPage).classList.add("selected");

            currentPage = newPage;
        }
    }
    else InitializeApp();
}

// Dark theme functions
function InitializeDarkTheme() {
    var dt = JSON.parse(window.localStorage.getItem('darkTheme'));
    if(dt) document.body.classList.add("dark-theme");
}

function ChangeDarkTheme() { // Initialize Dark Theme is in firebaseFunctions
    if(document.body.classList.contains("dark-theme")) {
        document.body.classList.remove("dark-theme");
        localStorage.setItem('darkTheme', false);
    }
    else {
        document.body.classList.add("dark-theme");
        localStorage.setItem('darkTheme', true);
    }
}

// Toggle, Open, and Close Menu
function ToggleMenu() {
    if(menu.classList.contains("hidden")) OpenMenu();
    else CloseMenu();
}

function CloseMenu() {
    menu.classList.add("hidden");
    document.getElementById("click-out").classList.add("hidden");
    document.getElementById("name-icon-container").classList.remove("menu-open");
    document.getElementById("menu-button").innerHTML = "menu";
}

function OpenMenu() {
    menu.classList.remove("hidden");
    document.getElementById("click-out").classList.remove("hidden");
    document.getElementById("name-icon-container").classList.add("menu-open");
    document.getElementById("menu-button").innerHTML = "close";
}




// Get Repair Description (Brand Model - Repair, Repair)
function GetRepairDescription(ticketObject) {
    var description = ticketObject.Device + ' ' + ticketObject.Model + ' - ';

    var line = '';
    var length = Object.keys(ticketObject.Repairs).length;
    var counter = 0;
    for(var i in ticketObject.Repairs) {
        if(length > counter + 2) line += ticketObject.Repairs[i].Display + ', ';
        else if(length > counter + 1) line += ticketObject.Repairs[i].Display + ' & ';
        else line += ticketObject.Repairs[i].Display;
        counter++;
    }
    
    description += line;
    return description;
}