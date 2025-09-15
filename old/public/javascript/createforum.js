$("#description").summernote({
  placeholder: "Enter your description here...",
  tabsize: 2,
  height: "30vh",
});


document
  .getElementById("submitbtn")
  .addEventListener("click", async function (e) {
    e.preventDefault();
    document.getElementById("titleError").style.display = "none";
    document.getElementById("contentError").style.display = "none";
    

    const title = document.getElementById("title").value;
    const description = $("#description").summernote("code");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);

    const response = await fetch(
      `${window.location.origin}/admin/dashboard/forums/create`,
      {
        method: "POST",
        body: formData,
      }
    );
    console.log(response);
    const result = await response.json();
    console.log(result);
    console.log(result?.type);
    if (response?.ok) {
      // Show the alert message
      const alertMessage = document.getElementById("alertMessage");
      alertMessage.innerText = result.msg;
      alertMessage.style.display = "block";

      // Hide the alert after 3 seconds
      setTimeout(() => {
        alertMessage.style.display = "none";
        window.location.href = `${window.location.origin}/admin/dashboard/forums`;
      }, 2000);
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
