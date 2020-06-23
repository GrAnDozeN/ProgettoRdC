function checkEmail() {
    checkEmailConf();

    let input = document.signupForm.inputEmail;
    let email = input.value.toLowerCase().trim();

    let regex = new RegExp(/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/, 'i');
    
    if (email.match(regex)) {
        input.setCustomValidity('');
        input.style.borderColor = "rgb(167, 250, 167)";
        return true;
    }
    else {
        input.setCustomValidity('Insert a valid email');
        input.style.borderColor = "rgb(255, 102, 102)";
        return false;
    }
}

function checkEmailConf() {

    if (document.signupForm.inputEmail.value != document.signupForm.inputEmailConfirm.value) {
        document.signupForm.inputEmailConfirm.setCustomValidity("Invalid field");
        document.signupForm.inputEmailConfirm.style.borderColor = "rgb(255, 102, 102)";
        return false;
    }
    document.signupForm.inputEmailConfirm.setCustomValidity("");
    document.signupForm.inputEmailConfirm.style.borderColor = "rgb(167, 250, 167)";
    return true;
}

function checkPassword() {
    checkPasswordConf();

    let input = document.signupForm.inputPassword;
    let password = input.value;

    let spazio = false;
		
	for (var i = 0; i <= password.length; i++) {
        if (password.charAt(i) == " ") {			//se a un certo punto trova lo spazio (charAt restituisce il carattere in pos i)
            spazio = true;
            break;
        }    
    }
    if (spazio) {																				
        input.setCustomValidity('Password can not contain space');
        input.style.borderColor = "rgb(255, 102, 102)";
        return false;
    }
    else if (password.length < 8) {
        input.setCustomValidity('Password needs to be at least 8 characters long');
        input.style.borderColor = "rgb(255, 102, 102)";
        return false;
    }
    input.setCustomValidity("");
    input.style.borderColor = "rgb(167, 250, 167)";
    return true;
}

function checkPasswordConf() {

    if (document.signupForm.inputPassword.value != document.signupForm.inputPasswordConfirm.value) {
        document.signupForm.inputPasswordConfirm.setCustomValidity("Invalid field");
        document.signupForm.inputPasswordConfirm.style.borderColor = "rgb(255, 102, 102)";
        return false;
    }
    document.signupForm.inputPasswordConfirm.setCustomValidity("");
    document.signupForm.inputPasswordConfirm.style.borderColor = "rgb(167, 250, 167)";
    return true;
}