// Initialize Summernote for existing elements
$("#summernote").summernote({
    placeholder: "Enter your content here...",
    tabsize: 2,
    height: "30vh",
  });
  $(".top_description_summernote").summernote({
    placeholder: "Enter Section Content",
    tabsize: 2,
    height: "30vh",
  });
  $(".bottom_description_summernote").summernote({
    placeholder: "Enter Section Content",
    tabsize: 2,
    height: "30vh",
  });
  
  document.getElementById("submitbtn").addEventListener("click", async function (e) {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const shortDescription = document.getElementById("shortdescription").value;
    const is_published = document.getElementById("is_published").checked;
    const is_dynamic=document.getElementById('is_dynamic').checked
    const id = document.getElementById("id").value;
    
    // Clear previous errors
    document.getElementById("titleError").style.display = "none";
    document.getElementById("contentError").style.display = "none";
    
    // Gather sections data
    const sections = Array.from(document.querySelectorAll(".section-item"));
    const sectionData = sections.map((section) => {
      const heading = section.querySelector('input[name="heading"]').value;
      const content = $(section.querySelector('textarea[name="content"]')).summernote('code');
      return { heading, content };
    });
  
    const top_description = $(".top_description_summernote").summernote("code");
    const bottom_description = $(".bottom_description_summernote").summernote("code");
  
    // Prepare data as JSON
    const formData = {
      title,
      short_description: shortDescription,
      is_published,
      sections: sectionData,
      top_description,
      bottom_description,
      is_dynamic
    };
  
    try {
      const response = await fetch(`${window.location.origin}/admin/pages/${id}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData), // Stringify the JSON object
      });
  
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
          window.location.href = `${window.location.origin}/admin/staticpages`;
        }, 3000);
      } else if (result?.type === "title") {
        document.getElementById("titleError").innerText = `* ${result?.err}`;
        document.getElementById("titleError").style.display = "block";
      } else if (result?.err) {
        document.getElementById("contentError").innerText = `* ${result?.err}`;
        document.getElementById("contentError").style.display = "block";
      }
    } catch (error) {
      document.getElementById("contentError").innerText = `* Network error: ${error.message}`;
      document.getElementById("contentError").style.display = "block";
    }
  });
  
  
  // Sidebar and section management functions
  document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.getElementById("sidebar");
    const toggleButton = document.getElementById("toggle-button");
    const body = document.body;
    let isSidebarVisible = false;
  
    // Sidebar toggle functions
    function showSidebar() {
      sidebar.style.transform = "translateX(0%)";
      toggleButton.style.display = "none";
      body.classList.add("sidebar-visible");
      isSidebarVisible = true;
    }
  
    function hideSidebar() {
      sidebar.style.transform = "translateX(-100%)";
      toggleButton.style.display = "block";
      body.classList.remove("sidebar-visible");
      isSidebarVisible = false;
    }
  
    toggleButton.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isSidebarVisible) hideSidebar();
      else showSidebar();
    });
  
    document.addEventListener("click", (e) => {
      if (isSidebarVisible && !sidebar.contains(e.target) && !toggleButton.contains(e.target)) {
        hideSidebar();
      }
    });
  
    sidebar.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  
    // Section management
    const formSections = document.getElementById("formSections");
  
    function addNewSection() {
      const newSection = document.createElement("div");
      newSection.classList.add("section-item");
  
      newSection.innerHTML = `
        <div class="header">
          <button type="button" class="swap-btn swapTop">
            <img src="/swapup.svg" width="30" height="30" alt="swap top" />
          </button>
          <button type="button" class="add-btn addSection">
            <img src="/add.png" width="30" height="30" alt="add" />
          </button>
          <button type="button" class="delete-btn deleteSection">
            <img src="/delete.svg" width="30" height="30" alt="delete" />
          </button>
          <button type="button" class="swap-btn swapBottom">
            <img src="/swapdown.svg" width="30" height="30" alt="swap bottom" />
          </button>
        </div>
        <div class="section" style="display: flex; flex-direction: column; gap: 20px; width: 100%;">
          <input type="text" name="heading" class="form-input" placeholder="Title" />
          <textarea name="content" class="form-textarea summernote-section" placeholder="Message"></textarea>
        </div>
      `;
  
      formSections.appendChild(newSection);
  
      // Reattach event listeners to new buttons
      attachListenersToButtons(newSection);
  
      // Initialize Summernote for the new textarea
      $(newSection.querySelector(".summernote-section")).summernote({
        placeholder: "Enter Section here...",
        tabsize: 2,
        height: "30vh",
      });
    }
  
    function attachListenersToButtons(sectionElement) {
      attachAddSectionListener(sectionElement.querySelector(".addSection"));
      attachDeleteSectionListener(sectionElement.querySelector(".deleteSection"));
      attachSwapTopListener(sectionElement.querySelector(".swapTop"));
      attachSwapBottomListener(sectionElement.querySelector(".swapBottom"));
    }
  
    function attachAddSectionListener(button) {
      button.addEventListener("click", addNewSection);
    }
  
    function attachDeleteSectionListener(button) {
      button.addEventListener("click", function () {
        const sectionToDelete = button.closest(".section-item");
        if (sectionToDelete) {
          document.getElementById("delete-confirmation-modal").style.display = "flex";
          document.getElementById("confirm-delete").onclick = function () {
            sectionToDelete.remove();
            document.getElementById("delete-confirmation-modal").style.display = "none";
          };
        }
      });
    }
  
    function attachSwapTopListener(button) {
      button.addEventListener("click", function () {
        const currentSection = button.closest(".section-item");
        const previousSection = currentSection.previousElementSibling;
        if (previousSection) {
          formSections.insertBefore(currentSection, previousSection);
        }
      });
    }
  
    function attachSwapBottomListener(button) {
      button.addEventListener("click", function () {
        const currentSection = button.closest(".section-item");
        const nextSection = currentSection.nextElementSibling;
        if (nextSection) {
          formSections.insertBefore(nextSection, currentSection);
        }
      });
    }
  
    // Event listener for canceling the delete action
    document.getElementById("cancel-delete").addEventListener("click", () => {
      document.getElementById("delete-confirmation-modal").style.display = "none";
    });
  
    // Attach listeners to initial section buttons
    attachListenersToButtons(document.querySelector(".section-item"));
  });
  