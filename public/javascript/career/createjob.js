// Initialize Summernote for the textareas
$("#responsibilities").summernote({
  placeholder: "Enter your responsibilities here...",
  tabsize: 2,
  height: "30vh",
});

$("#requirements").summernote({
  placeholder: "Enter your requirements here...",
  tabsize: 2,
  height: "30vh",
});

$("#benefits").summernote({
  placeholder: "Enter your benefits here...",
  tabsize: 2,
  height: "30vh",
});

// Add event listener for the submit button
document.getElementById("submitbtn").addEventListener("click", async () => {
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const benefits = $("#benefits").summernote("code");
  const requirements = $("#requirements").summernote("code");
  const responsibilities = $("#responsibilities").summernote("code");
  const lastDate = document.getElementById("last-date").value;
  const expiryDate = document.getElementById("expiry-date").value;
  const active=document.getElementById('active').checked;
  const company_name=document.getElementById('company_name').value;
  const salary=document.getElementById('salary').value;

  // Check if the expiry date is earlier than the last date to apply
  if (new Date(expiryDate) < new Date(lastDate)) {
    document.getElementById("expiry-date-error").style.display = "block";
    document.getElementById("expiry-date-error").style.color = "red";
    document.getElementById("expiry-date-error").innerHTML = "*Expiry Date cannot be earlier than the Last Date to Apply.";
  
    return;
  }

  // Create a plain JavaScript object
  const data = {
    title,
    description,
    benefits,
    requirements,
    responsibilities,
    last_date: lastDate,
    expiry_date: expiryDate,
    company_name:company_name,
    active:active,
    salary:salary
  };

  console.log(data);

  // Send the data as JSON
  const response = await fetch(
    `${window.location.origin}/admin/career/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();

  console.log(result);

  if (!response.ok) {
    if (result.err) {
      document.getElementById("titleError").style.display = "block";
      document.getElementById("titleError").innerHTML = `* ${result.err}`;
      return;
    }
  }

  document.getElementById("alertMessage").style.display = "block";
  setTimeout(() => {
    document.getElementById("alertMessage").style.display = "none";
    window.location.href = `${window.location.origin}/admin/career`;
  }, 2000);
});
