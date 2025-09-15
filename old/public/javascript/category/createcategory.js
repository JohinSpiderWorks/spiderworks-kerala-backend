$(document).ready(function () {
  // Initialize Summernote
  $("#category-description").summernote({
    placeholder: "Enter category description",
    tabsize: 2,
    height: 220,
  });

  // Form submission
  $(".form-container").submit(function (e) {
    e.preventDefault();

    const name = $("#category-name").val().trim();
    const title = $("#category-title").val().trim();
    const description = $("#category-description").summernote("code");
    const metaTitle = $("#meta-title").val().trim(); // New meta title input
    const metaDescription = $("#meta-description").val().trim(); // New meta description input
    const alertBox = document.createElement("div");
    alertBox.className = "alert-box";
    alertBox.style.position = "absolute";
    alertBox.style.bottom = "0%";
    alertBox.style.right = "0%";
    alertBox.style.padding = "20px";
    alertBox.style.borderRadius = "10px";
    alertBox.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.2)";
    alertBox.style.zIndex = "1000";

    // Reset error messages
    $("#nameError, #titleError, #descriptionError").text("");

    // Validate inputs
    let isValid = true;

    if (!name) {
      $("#nameError").text("* Name is required");
      isValid = false;
    }

    if (!title) {
      $("#titleError").text("* Title is required");
      isValid = false;
    }

    if (!description) {
      $("#descriptionError").text("* Description is required");
      isValid = false;
    }

    if (isValid) {
      fetch("/admin/category", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          title: title,
          description: description,
          meta_title: metaTitle, // Append meta title
          meta_description: metaDescription // Append meta description
        }),
      })
        .then((response) => response.json())
        .then((data) => {
           
          if (!data?.err) {
            alertBox.style.background = "green";
            alertBox.style.color = "white";
            alertBox.innerHTML = "Created successfully!";

            document.body.appendChild(alertBox);
            setTimeout(() => {
              document.body.removeChild(alertBox);
              window.location.href = "/admin/category";
            }, 3000);
          } else {
            alertBox.style.background = "red";
            alertBox.style.color = "white";
            alertBox.innerHTML =  data?.err;
            document.body.appendChild(alertBox);
            setTimeout(() => {
                document.body.removeChild(alertBox);
              }, 3000);
          }
        })
        .catch((error) => {
          alertBox.style.background = "red";
          alertBox.style.color = "white";
          alertBox.innerHTML =  error.message;
          document.body.appendChild(alertBox);
          setTimeout(() => {
            document.body.removeChild(alertBox);
          }, 3000);
        });
    }
  });
});
