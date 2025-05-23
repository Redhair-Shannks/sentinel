// Script to handle redirects to Clerk authentication pages
document.addEventListener('DOMContentLoaded', () => {
  console.log("Clerk redirect script loaded");
  
  // Function to check if user is authenticated - improved cookie detection
  function checkIsAuthenticated() {
    // Look for Clerk session cookies - improved detection
    const cookieString = document.cookie;
    console.log("Cookies:", cookieString);
    
    // Check for ANY Clerk-related cookies (be very liberal in detection)
    const clerkCookies = cookieString.split(';')
      .map(c => c.trim())
      .filter(c => 
        c.includes('__session') || 
        c.includes('__clerk') || 
        c.includes('__client')
      );
    
    console.log("Found clerk cookies:", clerkCookies);
    
    // Consider authenticated if ANY clerk cookies are found
    const isAuthenticated = clerkCookies.length > 0;
    
    console.log("Authentication check result:", isAuthenticated);
    return isAuthenticated;
  }
  
  // Get all the relevant buttons
  const signUpButtons = document.querySelectorAll('a[href="/sign-up"]');
  const signInButtons = document.querySelectorAll('a[href="/sign-in"]');
  const mobileSignUpButton = document.querySelector('.nav__button--mobile');
  
  console.log("Found buttons:", {
    signUpButtons: signUpButtons.length,
    signInButtons: signInButtons.length,
    mobileButton: mobileSignUpButton ? "Found" : "Not found"
  });
  
  // Store original button text
  const originalTexts = new Map();
  
  signUpButtons.forEach((btn, i) => {
    originalTexts.set(`signup-${i}`, btn.textContent);
    console.log(`Sign-up button ${i} text:`, btn.textContent);
  });
  
  signInButtons.forEach((btn, i) => {
    originalTexts.set(`signin-${i}`, btn.textContent);
    console.log(`Sign-in button ${i} text:`, btn.textContent);
  });
  
  if (mobileSignUpButton) {
    originalTexts.set('mobile', mobileSignUpButton.textContent);
    console.log("Mobile button text:", mobileSignUpButton.textContent);
  }
  
  // Check authentication state and update UI
  const isAuthenticated = checkIsAuthenticated();
  
  if (isAuthenticated) {
    console.log("User is authenticated - showing Dashboard buttons");
    
    // Update sign-up buttons
    signUpButtons.forEach(button => {
      button.textContent = "Dashboard";
      button.href = "/dashboard";
      console.log("Updated signup button to Dashboard");
    });
    
    // Update sign-in buttons
    signInButtons.forEach(button => {
      button.textContent = "Dashboard";
      button.href = "/dashboard";
      console.log("Updated signin button to Dashboard");
    });
    
    // Update mobile button
    if (mobileSignUpButton) {
      mobileSignUpButton.textContent = "Dashboard";
      mobileSignUpButton.href = "/dashboard";
      console.log("Updated mobile button to Dashboard");
    }
  } else {
    console.log("User is NOT authenticated - keeping original button text");
    
    // For sign-up buttons - keep original text but set click handler
    signUpButtons.forEach((button, i) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        console.log(`Sign-up button ${i} clicked, redirecting to sign-up`);
        window.location.href = '/sign-up?redirect_url=/auth-callback';
      });
    });
    
    // For sign-in buttons - keep original text but set click handler
    signInButtons.forEach((button, i) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        console.log(`Sign-in button ${i} clicked, redirecting to sign-in`);
        window.location.href = '/sign-in?redirect_url=/auth-callback';
      });
    });
    
    // For mobile button - keep original text but set click handler
    if (mobileSignUpButton) {
      mobileSignUpButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log("Mobile button clicked, redirecting to sign-up");
        window.location.href = '/sign-up?redirect_url=/auth-callback';
      });
    }
  }
  
  // Function to check server auth status (keep for background checking but don't show UI)
  function checkServerAuth() {
    fetch('/api/auth-status')
      .then(response => response.json())
      .then(data => {
        console.log("Server auth response:", data);
      })
      .catch(err => {
        console.error("Error checking server auth:", err);
      });
  }
  
  // Check server auth on load (keep this functionality)
  checkServerAuth();
  
  console.log('Clerk redirect handlers initialization complete');
}); 