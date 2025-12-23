let checkbox = document.querySelector("#switch");
let body = document.querySelector("body");

let localStorageTheme = localStorage.getItem('theme');

const setThemeColor = () => {
    localStorageTheme === "dark" ? setDarkMode() : setLightMode();
}

const checkModeSetting = () => {
    window.matchMedia('(prefers-color-cheme: dark)').addEventListener('change', () => {
        checkThemeChange();
    })
}

const checkThemeChange = () => {
    if(localStorageTheme === null && window.matchMedia('(prefers-color-cheme: dark)').matches){
        setDarkMode();
    }else if (localStorageTheme && window.matchMedia('(prefers-color-cheme: dark)').matches){
        setDarkMode()
    }else {
        setLightMode()
    }
}

const setDarkMode = () => {
    body.classList = 'dark';
    localStorage.setItem('theme', "dark");
    checkbox.checked = true;
}

const setLightMode = () => {
    body.classList = 'light';
    localStorage.setItem('theme', "light");
    checkbox.checked = false;
}

checkModeSetting();
checkThemeChange();
setThemeColor();

checkbox.addEventListener(
  "click", () => {
    checkbox.checked ? setDarkMode() : setLightMode()
  }
);

