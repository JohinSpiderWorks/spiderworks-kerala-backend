$("#description").summernote({
  placeholder: "Enter your content here...",
  tabsize: 2,
  height: "30vh",
});

document
  .getElementById("submitbtn")
  .addEventListener("click", async function (e) {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const description = $("#description").summernote("code");
    const id = document.getElementById("id").value;
    document.getElementById("titleError").style.display = "none";
    document.getElementById("contentError").style.display = "none";

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);

    const response = await fetch(
      `${window.location.origin}/admin/dashboard/forums/update/${id}`,
      {
        method: "PUT",
        body: formData,
      }
    );

    console.log(formData.get("description"), formData.get("published"));

    const result = await response.json();
    console.log(result);
    if (response.ok) {
      // Show the alert message
      const alertMessage = document.getElementById("alertMessage");
      alertMessage.innerText = result.msg;
      alertMessage.style.display = "block";

      // Hide the alert after 3 seconds
      setTimeout(() => {
        alertMessage.style.display = "none";
        window.location.href = `${window.location.origin}/admin/dashboard/forums`;
      }, 3000);
    }
    if (result?.type == "title") {
      document.getElementById("titleError").innerText = `* ${result?.err}`;
      document.getElementById("titleError").style.display = "block";
      return;
    }
    if (result?.err) {
      document.getElementById("contentError").innerText = `* ${result?.err}`;
      document.getElementById("contentError").style.display = "block";
      return;
    }
  });

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const toggleButton = document.getElementById("toggle-button");
  const body = document.body; // Get the body element
  let isSidebarVisible = false;

  function showSidebar() {
    sidebar.style.transform = "translateX(0%)";
    toggleButton.style.display = "none"; // Hide button when sidebar is visible
    body.classList.add("sidebar-visible");
    isSidebarVisible = true;
  }

  function hideSidebar() {
    sidebar.style.transform = "translateX(-100%)";
    toggleButton.style.display = "block"; // Show button when sidebar is hidden
    body.classList.remove("sidebar-visible");
    isSidebarVisible = false;
  }

  toggleButton.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent click event from bubbling up
    if (isSidebarVisible) {
      hideSidebar();
    } else {
      showSidebar();
    }
  });

  // Hide sidebar when clicking outside of it
  document.addEventListener("click", (e) => {
    if (
      isSidebarVisible &&
      !sidebar.contains(e.target) &&
      !toggleButton.contains(e.target)
    ) {
      hideSidebar();
    }
  });

  // Stop propagation when clicking inside the sidebar to prevent it from closing
  sidebar.addEventListener("click", (e) => {
    e.stopPropagation();
  });
});

//   add new sections

document.addEventListener("DOMContentLoaded", function () {
  const formSections = document.getElementById("formSections");

  // Function to add a new section
  function addNewSection() {
    const newSection = document.createElement("div");
    newSection.classList.add("section-item");

    newSection.innerHTML = `
              <div class="header">
                  <button type="button" class="add-btn addSection"><img src="/add.png" width="30" height="30" alt="add"></button>
                  <button type="button" class="delete-btn deleteSection"><img src="/delete.svg" width="30" height="30" alt="delete"></button>
              </div>
              <div class="section" style="display: flex; flex-direction: column; gap: 20px; width: 100%;">
                  <input
                      type="text"
                      name="heading"
                      class="form-input"
                      placeholder="Title"
                  />
                  <textarea
                      name="content"
                      class="form-textarea summernote-section"
                      placeholder="Message"
                  ></textarea>
              </div>
          `;

    formSections.appendChild(newSection);

    // Attach event listeners to the new buttons
    attachAddSectionListener(newSection.querySelector(".addSection"));
    attachDeleteSectionListener(newSection.querySelector(".deleteSection"));
  }

  // Function to attach event listener to "+" buttons
  function attachAddSectionListener(button) {
    button.addEventListener("click", addNewSection);
    $(".summernote-section").summernote({
      placeholder: "Enter Section here...",
      tabsize: 2,
      height: "30vh",
    });
  }

  // Function to attach event listener to "-" buttons
  function attachDeleteSectionListener(button) {
    button.addEventListener("click", function () {
      document.getElementById("delete-confirmation-modal").style.display =
        "flex";
    });
  }

  document.getElementById("cancel-delete").addEventListener("click", () => {
    document.getElementById("delete-confirmation-modal").style.display = "none";
  });
  document.getElementById("confirm-delete").addEventListener("click", () => {
    document.getElementById("delete-confirmation-modal").style.display = "none";
    document.querySelector(".deleteSection").closest(".section-item").remove();
  });

  // Attach listeners to the initial "+" and "-" buttons
  formSections
    .querySelectorAll(".addSection")
    .forEach((button) => attachAddSectionListener(button));
  formSections
    .querySelectorAll(".deleteSection")
    .forEach((button) => attachDeleteSectionListener(button));
});
