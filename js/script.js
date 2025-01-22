import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { firebaseConfig } from '../config.js';




// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Now you can use Firebase services like auth, db, etc.

document.getElementById('amount').addEventListener('input', function () {
  const amountInput = document.getElementById('amount');
  const amount = parseInt(amountInput.value, 10);
  const repayableMessage = document.getElementById('repayableAmount');
  const amountError = document.getElementById('amountError');
  const dueDateMessage = document.getElementById('dueDateMessage');
  const today = new Date();
  const dueDate = new Date(today.setDate(today.getDate() + 31)); // 31 days from today

  if (isNaN(amount)) {
    repayableMessage.textContent = '';
    dueDateMessage.textContent = '';
    return;
  }

  if (amount < 100) {
    amountError.textContent = 'Amount must be more than R100.';
    amountError.style.display = 'block';
    amountInput.classList.add('error');
    repayableMessage.textContent = ''; // Clear repayable message
    dueDateMessage.textContent = ''; // Clear due date message
  } else if (amount > 1000) {
    amountError.textContent = 'Amount must be less than R1000.';
    amountError.style.display = 'block';
    amountInput.classList.add('error');
    repayableMessage.textContent = ''; // Clear repayable message
    dueDateMessage.textContent = ''; // Clear due date message
  } else {
    amountError.textContent = '';
    amountError.style.display = 'none';
    amountInput.classList.remove('error');
    const totalRepayable = amount + amount * 0.5; // 50% interest
    repayableMessage.textContent = `Total amount repayable: R${totalRepayable.toFixed(2)}`;
    
    // Format due date to dd/mm/yyyy
    const dueDateString = `${dueDate.getDate().toString().padStart(2, '0')}/${(dueDate.getMonth() + 1).toString().padStart(2, '0')}/${dueDate.getFullYear()}`;
    dueDateMessage.textContent = `Repayment due by: ${dueDateString}`;
  }
});

document.getElementById('loanForm').addEventListener('submit', async function (event) {
  event.preventDefault(); // Prevent form submission immediately

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const amount = parseInt(document.getElementById('amount').value, 10);
  const collateral = document.getElementById('collateral').value.trim();
  const amountError = document.getElementById('amountError');
  const phoneError = document.getElementById('phoneError');
  const collateralError = document.getElementById('collateralError');
  const phonePattern = /^[0-9]{9}$/; // South African phone numbers are 9 digits long
  const confirmationMessage = document.getElementById('confirmationMessage');
  const agreementMessage = document.getElementById('agreementMessage');
  const confirmationModal = document.getElementById('confirmationModal');
  const continueButton = document.getElementById('continueButton');
  const cancelButton = document.getElementById('cancelButton');
  const contactedModal = document.getElementById('contactedModal');
  const closeContactedModal = document.getElementById('closeContactedModal');
  const today = new Date();
  const dueDate = new Date(today.setDate(today.getDate() + 31)); // 31 days from today

  let isValid = true;

  // Validate loan amount
  if (amount < 100) {
    amountError.textContent = 'Amount must be more than R100.';
    amountError.style.display = 'block';
    isValid = false;
  } else if (amount > 1000) {
    amountError.textContent = 'Amount must be less than R1000.';
    amountError.style.display = 'block';
    isValid = false;
  } else {
    amountError.textContent = '';
    amountError.style.display = 'none';
  }

  // Validate phone number
  if (!phonePattern.test(phone)) {
    phoneError.textContent = 'Please enter a valid 9-digit South African phone number.';
    phoneError.style.display = 'block';
    document.getElementById('phone').classList.add('error');
    isValid = false;
  } else {
    phoneError.textContent = '';
    phoneError.style.display = 'none';
    document.getElementById('phone').classList.remove('error');
  }

  // Validate collateral
  if (!collateral) {
    collateralError.textContent = 'Please enter collateral.';
    collateralError.style.display = 'block';
    isValid = false;
  } else {
    collateralError.textContent = '';
    collateralError.style.display = 'none';
  }

  if (isValid && name && email && phone && collateral) {
    const totalRepayable = amount + amount * 0.5; // 50% interest
    const dueDateString = `${dueDate.getDate().toString().padStart(2, '0')}/${(dueDate.getMonth() + 1).toString().padStart(2, '0')}/${dueDate.getFullYear()}`;

    confirmationMessage.style.color = 'green'; // Set text color to green
    agreementMessage.textContent = `I, ${name}, agree that I will repay R${totalRepayable.toFixed(2)} before or on ${dueDateString}.`;

    // Show the confirmation modal
    confirmationModal.classList.add('show');

    // Continue button click
    continueButton.addEventListener('click', async function () {
      // Close the confirmation modal
      confirmationModal.classList.remove('show');
      
      // Show the "You will be contacted shortly" modal
      contactedModal.classList.add('show');
      contactedModal.innerHTML = `<div class="modal-content"><p>Submitting your loan application...</p></div>`;

      // Firebase Firestore integration to save data
      try {
        await addDoc(collection(db, 'loanApplications'), {
          name,
          email,
          phone,
          amount,
          collateral,
          totalRepayable,
          dueDate: dueDateString,
          timestamp: serverTimestamp()
        });
        
        // If successful, update the modal with a success message
        contactedModal.innerHTML = `
          <div class="modal-content">
            <p>Your application was submitted successfully. Check your emails, You will be contacted shortly.</p>
            <button id="closeContactedModal">Close</button>
          </div>
        `;
        contactedModal.style.color = 'green'; // Optional: change text color to green for success

        console.log('Loan application submitted successfully');
      } catch (error) {
        // If there's an error, update the modal with an error message
        contactedModal.innerHTML = `
          <div class="modal-content">
            <p>There was an error submitting your loan application. Please try again later.</p>
            <button id="closeContactedModal">Close</button>
          </div>
        `;
        contactedModal.style.color = 'red'; // Optional: change text color to red for error

        console.error('Error submitting loan application:', error);
      }

      // Close the modal when the close button is clicked
      const closeModalButton = document.getElementById('closeContactedModal');
      closeModalButton.addEventListener('click', function () {
        contactedModal.classList.remove('show');
      });
    });

    // Cancel button click
    cancelButton.addEventListener('click', function () {
      // Close the confirmation modal without submitting
      confirmationModal.classList.remove('show');
    });
  }
});

// Close the "You will be contacted shortly" modal
closeContactedModal.addEventListener('click', function () {
  contactedModal.classList.remove('show');
});

document.getElementById('phone').addEventListener('input', function () {
  const phoneInput = document.getElementById('phone');
  const phoneError = document.getElementById('phoneError');
  const phonePattern = /^[0-9]{9}$/; // South African phone numbers are 9 digits long

  if (!phonePattern.test(phoneInput.value)) {
    phoneError.textContent = 'Please enter a valid 9-digit South African phone number.';
    phoneError.style.display = 'block';
    phoneInput.classList.add('error');
  } else {
    phoneError.textContent = '';
    phoneError.style.display = 'none';
    phoneInput.classList.remove('error');
  }
});
