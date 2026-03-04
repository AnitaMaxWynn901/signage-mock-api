// scripts/feedback.js

const form = document.getElementById('feedbackForm');
const submitBtn = document.getElementById('submitBtn');
const successMessage = document.getElementById('successMessage');

// Load current shop into dropdown
const shopSelect = document.getElementById('shop');
shopSelect.value = getCurrentShop();

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        type: document.getElementById('type').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value,
        shop: document.getElementById('shop').value,
        timestamp: new Date().toISOString()
    };

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        // Simulate API call (replace with actual endpoint later)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // For now, just log to console
        console.log('Feedback submitted:', formData);

        // Show success message
        successMessage.style.display = 'block';
        form.reset();

        // Hide success message after 5 seconds
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 5000);

    } catch (error) {
        alert('Error submitting feedback: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Feedback';
    }
});