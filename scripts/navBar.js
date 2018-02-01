function myFunction() {
    var x = document.getElementById("myTopnav");
    if (x.className === "topnav") {
        x.className += " responsive";
        x.style.position = "fixed"
    } else {
        x.className = "topnav";
    }
}
window.addEventListener('scroll', function (evt) {
    let nav = document.getElementById("myTopnav");
    if (window.pageYOffset >= (window.innerHeight - 200)) {

        nav.style.backgroundColor = "#000";
        nav.style.visibility = "visible"
        nav.style.opacity = 1;
        nav.style.transition = "visibility 0.5s, opacity 0.5s linear";

    } else {

        nav.style.visibility = "hidden";
        nav.style.opacity = 0;
        nav.style.transition = "visibility 0.5s, opacity 0.5s linear";

    }
});

function onAboutClick() {
    closeMobileNav();
}

function onPortfolioClick() {
    closeMobileNav();
}

function onTitleClick() {
    closeMobileNav();
}

function onContactClick() {
    closeMobileNav();
}

function closeMobileNav() {
    var ul = document.getElementsByClassName('topnav')[0];
    ul.className = "topnav";
}