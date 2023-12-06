// CLASS APP
class App {
    constructor() {
      this.posts = [];
      this.files = [];
      this.selectedOptionsId = "";
      this.selectedOptionsCaption = "";
      this.selectedOptionsImage = "";
      this.indexOfPost = "";
  
      // POST OBJECT
      this.post = {
        id: cuid(),
        caption: "",
        image: "",
        username: "",
        timestamp: this.getTimestamp(),
      };
  
      // DOM USER INTERFACE
      this.$app = document.querySelector("#app");
      this.$firebaseAuthContainer = document.querySelector(
        "#firebaseui-auth-container"
      );
  
      // DOM FUNCTIONALITIES
      this.$authUser = document.querySelector(".auth-user");
      this.$uploadBtn = document.querySelector(".upload-container");
      this.$postContainer = document.querySelector(".post-container");
      this.$filesToUpload = document.querySelector("#files");
      this.$sendBtn = document.querySelector("#send");
      this.$progress = document.querySelector("#progress");
      this.$uploadingBar = document.querySelector("#uploading");
      this.$captionText = document.querySelector("#caption-text");
      this.$posts = document.querySelector(".posts");
      this.$postTime = document.querySelector(".posted-time");
      this.$defaultModal = document.querySelector(".default-modal");
      this.$btnModalOpen = document.querySelector(".options");
      this.$authModal = document.querySelector(".authenticated-modal");
      this.$modalContent = document.querySelector("#auth-modal");
      this.$editBtn = document.querySelector("#edit-btn");
      this.$updateBtn = document.querySelector("#update-post");
      this.$deleteBtn = document.querySelector("#delete-post");
  
      this.ui = new firebaseui.auth.AuthUI(auth);
      this.handleAuth();
  
      this.addEventListener();
  
      this.displayPost();
    }
  
    // AUTHENTICATION
    handleAuth() {
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          this.post.username = user.displayName;
          this.userId = user.uid;
          this.redirectToApp();
        } else {
          this.redirectToAuth();
        }
      });
    }
  
    redirectToApp() {
      this.$firebaseAuthContainer.style.display = "none";
      this.$postContainer.style.display = "none";
      this.$app.style.display = "block";
      this.fetchPostsFromDB();
    }
  
    redirectToAuth() {
      this.$firebaseAuthContainer.style.display = "block";
      this.$app.style.display = "none";
      this.$postContainer.style.display = "none";
      this.ui.start("#firebaseui-auth-container", {
        signInOptions: [
          firebase.auth.EmailAuthProvider.PROVIDER_ID,
          firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        ],
        // Other config options...
      });
    }
  
    // EVENT LISTENERS
    addEventListener() {
      document.body.addEventListener("click", (event) => {
        this.openModalOnOptions(event);
        this.closeModal(event);
        this.closeDefaultModal(event);
        this.handleUpdate(event);
        this.handleDeletePost(event);
      });
      this.$filesToUpload.addEventListener("change", (event) => {
        this.handleFileChosen(event);
      });
      this.$captionText.addEventListener("change", (event) => {
        this.post.caption = event.target.value;
      });
      this.$sendBtn.addEventListener("click", (event) => {
        this.uploadToFB();
      });
      this.$uploadBtn.addEventListener("click", (event) => {
        this.redirectToPost(event);
      });
      this.$authUser.addEventListener("click", (event) => {
        this.handleLogout(event);
      });
    }
  
    // MODAL FUNCTIONALITIES
    openModalOnOptions(event) {
      const $selectedOptions = event.target.closest(".options");
      if ($selectedOptions) {
        this.selectedOptionsId = $selectedOptions.id;
        this.handleModalPop(event);
      }
    }
  
    handleModalPop(event) {
      const $selectedPost = event.target.closest(".post");
      this.selectedOptionsCaption =
        $selectedPost.children[2].childNodes[3].childNodes[2].nextSibling.innerText;
      const $postUsername = $selectedPost.children[0].innerText;
      if ($postUsername.length === this.post.username.length) {
        this.openModal();
      } else {
        this.openDefaultModal();
      }
    }
    openDefaultModal() {
      this.$defaultModal.style.display = "block";
    }
  
    openModal() {
      this.$authModal.style.display = "block";
    }
  
    closeModal(event) {
      if (event.target == this.$authModal) {
        this.$authModal.style.display = "none";
      }
    }
  
    closeModalAfterUpdate() {
      this.$authModal.style.display = "none";
    }
  
    closeDefaultModal(event) {
      if (event.target == this.$defaultModal) {
        this.$defaultModal.style.display = "none";
      }
    }
    
    handleUpdate(event) {
      const isEditBtnClickedOn = this.$editBtn.contains(event.target);
      const isUpdateBtnClickedOn = this.$updateBtn.contains(event.target);
      const isInputFileClickedOn = this.$filesToUpload.contains(event.target);
      if (isEditBtnClickedOn) {
        this.$app.style.display = "none";
        this.$postContainer.style.display = "block";
        this.$updateBtn.style.display = "block";
        this.$sendBtn.style.display = "none";
        this.$captionText.value = this.selectedOptionsCaption;
      } else if (isUpdateBtnClickedOn) {
        this.fetchImageFromDB();
      } else if (isInputFileClickedOn) {
        this.$sendBtn.style.display = "block";
        this.$updateBtn.style.display = "none";
        this.uploadToFB();
        this.deletePost(this.selectedOptionsId);
      }
    }
  
    handleDeletePost(event) {
      const isDeleteBtnClickedOn = this.$deleteBtn.contains(event.target);
      if (isDeleteBtnClickedOn) {
        this.deletePost(this.selectedOptionsId);
        this.RemoveFromDB();
        this.$authModal.style.display = "none";
      }
    }
  
    fetchImageFromDB() {
      var docRef = db.collection("users").doc(this.userId);
  
      docRef
        .get()
        .then((doc) => {
          if (doc.exists) {
            this.getIndex();
            console.log(
              "Document data:",
              doc.data().posts[this.indexOfPost].image
            );
            const fileLink = doc.data().posts[this.indexOfPost].image;
            this.updatePost(fileLink);
          } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
          }
        })
        .catch((error) => {
          console.log("Error getting document:", error);
        });
    }
    //  INDEX OF POST
    getIndex() {
      const index = this.posts
        .map((post) => post.id)
        .indexOf(this.selectedOptionsId);
      this.indexOfPost = index;
    }
  
    updatePost(fileLink) {
      this.editPost(this.selectedOptionsId, {
        image: fileLink,
        caption: this.$captionText.value,
      });
      this.$progress.value = "";
      this.$uploadingBar.innerHTML = "";
      this.$captionText.value = "";
      this.redirectToApp();
    }
  
    postImage({ image, caption }) {
      const lowerCaseUsername = this.loginUsername.toLocaleLowerCase();
      const username = lowerCaseUsername.replace(/\s/g, "");
      const newPost = {
        id: cuid(),
        image,
        caption,
        username,
        timestamp: this.getTimestamp(),
      };
      this.posts = [...this.posts, newPost];
    }
    getTimestamp() {
      const d = new Date();
      const timestamp = d.getHours() + ":" + d.getUTCMinutes();
      return timestamp;
    }
    editPost(id, { image, caption }) {
      this.posts = this.posts.map((post) => {
        if (post.id == id) {
          post.image = image;
          post.caption = caption;
        }
        return post;
      });
    }
    deletePost(id) {
      this.posts = this.posts.filter((post) => post.id != id);
    }
  
    // LOGOUT FUNCTIONALITIES
    handleLogout() {
      firebase
        .auth()
        .signOut()
        .then(() => {
          this.redirectToAuth();
        })
        .catch((error) => {
          console.log("ERROR OCCURRED", error);
        });
    }
  
    redirectToPost() {
      this.$postContainer.style.display = "block";
      this.$firebaseAuthContainer.style.display = "none";
      this.$app.style.display = "none";
    }
  
    // UPLOAD TO DATABASE
    handleFileChosen(event) {
      this.files = event.target.files;
      if (this.files.length > 0) {
        alert("File chosen!");
      } else {
        alert("No file chosen!");
      }
    }
  
    uploadToFB() {
      for (let i = 0; i < this.files.length; i++) {
        const name = this.files[i].name;
        const upload = storage.ref(name).put(this.files[i]);
        upload
          .then((snapshot) => {
            console.log("'Successfully uploaded image");
            this.progressBar(snapshot);
            this.getFileUrl(name);
          })
          .catch((error) => {
            console.log(error, "Error Loading File Happend!");
          });
      }
    }
  
    progressBar(snapshot) {
      const percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      this.$progress.value = percentage;
      if (percentage) {
        this.$uploadingBar.innerHTML = `${this.files[0].name} Uploaded`;
      }
    }
    getFileUrl(name) {
      const imageRef = storage.ref(name);
      imageRef
        .getDownloadURL()
        .then((url) => {
          (this.post.image = url)
          this.posts.push(this.post);
          console.log(this.post.image);
          this.savePosts();
        })
        .catch((error) => {
          console.log(error, "Error Occurred!");
        });
    }
  
    // FETCH FROM DATABASE
    fetchPostsFromDB() {
      var docRef = db.collection("users").doc(this.userId);
      docRef
        .get()
        .then((doc) => {
          if (doc.exists) {
            console.log("Document data:", doc.data().posts);
            this.posts = doc.data().posts;
            this.displayPost();
          } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
            db.collection("users")
              .doc(this.userId)
              .set({
                posts: this.posts,
              })
              .then(() => {
                console.log("User successfully Created!");
              })
              .catch((error) => {
                console.error("Error writing document: ", error);
              });
          }
        })
        .catch((error) => {
          console.log("Error getting document:", error);
        });
    }
  
    // DELETING POST FROM DATABASE
    RemoveFromDB() {
      var docRef = db.collection("users").doc(this.userId);
      docRef
        .delete(this.post.id)
        .then((doc) => {
          console.log("file succesfully deleted");
          location.reload();
        })
        .catch((error) => {
          console.log("Oopsy, an error occurred!");
        });
      
    }
  
    // SAVE TO DATABASE
    savePosts() {
      db.collection("users")
        .doc(this.userId)
        .set({
          posts: this.posts,
        })
        .then(() => {
          console.log("Document successfully written!");
          this.redirectToApp();
          this.closeModalAfterUpdate();
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
    }
  
    // CONTENT FROM DATABASE
    displayPost() {
      this.$posts.innerHTML = this.posts
        .map(
          (post) =>
            `<div class="post" id="${post.id}">
              <div class="header">
                <div class="profile-area">
                  <div class="post-pic">
                    <img
                      alt="jayshetty's profile picture"
                      class="_6q-tv"
                      data-testid="user-avatar"
                      draggable="false"
                      src="assets/akhil.png"
                    />
                  </div>
                  <span class="profile-name">${post.username}</span>
                </div>
                <div class="options" id="${post.id}">
                <button type="button" class="more-btn"> 
                <div
                class="Igw0E rBNOH YBx95 _4EzTm"
                style="height: 24px; width: 24px"
                >
                    <svg
                      aria-label="More options"
                      class="_8-yf5"
                      fill="#262626"
                      height="16"
                      viewBox="0 0 48 48"
                      width="16"
                    >
                      <circle
                        clip-rule="evenodd"
                        cx="8"
                        cy="24"
                        fill-rule="evenodd"
                        r="4.5"
                      ></circle>
                      <circle
                        clip-rule="evenodd"
                        cx="24"
                        cy="24"
                        fill-rule="evenodd"
                        r="4.5"
                      ></circle>
                      <circle
                        clip-rule="evenodd"
                        cx="40"
                        cy="24"
                        fill-rule="evenodd"
                        r="4.5"
                      ></circle>
                    </svg>
                    </div>
                    </button>
                    </div>
              </div>
              <div class="body">
                <img
                  alt="Photo by Jay Shetty on September 12, 2020. Image may contain: 2 people."
                  class="FFVAD"
                  decoding="auto"
                  sizes="614px"
                  src="${post.image}"
                  style="object-fit: cover"
                />
              </div>
              <div class="footer">
                <div class="user-actions">
                  <div class="like-comment-share">
                    <div>
                      <span class=""
                        ><svg
                          aria-label="Like"
                          class="_8-yf5"
                          fill="#262626"
                          height="24"
                          viewBox="0 0 48 48"
                          width="24"
                        >
                          <path
                            d="M34.6 6.1c5.7 0 10.4 5.2 10.4 11.5 0 6.8-5.9 11-11.5 16S25 41.3 24 41.9c-1.1-.7-4.7-4-9.5-8.3-5.7-5-11.5-9.2-11.5-16C3 11.3 7.7 6.1 13.4 6.1c4.2 0 6.5 2 8.1 4.3 1.9 2.6 2.2 3.9 2.5 3.9.3 0 .6-1.3 2.5-3.9 1.6-2.3 3.9-4.3 8.1-4.3m0-3c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5.6 0 1.1-.2 1.6-.5 1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5z"
                          ></path>
                        </svg>
                      </span>
                    </div>
                    <div class="margin-left-small">
                      <svg
                        aria-label="Comment"
                        class="_8-yf5"
                        fill="#262626"
                        height="24"
                        viewBox="0 0 48 48"
                        width="24"
                      >
                        <path
                          clip-rule="evenodd"
                          d="M47.5 46.1l-2.8-11c1.8-3.3 2.8-7.1 2.8-11.1C47.5 11 37 .5 24 .5S.5 11 .5 24 11 47.5 24 47.5c4 0 7.8-1 11.1-2.8l11 2.8c.8.2 1.6-.6 1.4-1.4zm-3-22.1c0 4-1 7-2.6 10-.2.4-.3.9-.2 1.4l2.1 8.4-8.3-2.1c-.5-.1-1-.1-1.4.2-1.8 1-5.2 2.6-10 2.6-11.4 0-20.6-9.2-20.6-20.5S12.7 3.5 24 3.5 44.5 12.7 44.5 24z"
                          fill-rule="evenodd"
                        ></path>
                      </svg>
                    </div>
                    <div class="margin-left-small">
                      <svg
                        aria-label="Share Post"
                        class="_8-yf5"
                        fill="#262626"
                        height="24"
                        viewBox="0 0 48 48"
                        width="24"
                      >
                        <path
                          d="M47.8 3.8c-.3-.5-.8-.8-1.3-.8h-45C.9 3.1.3 3.5.1 4S0 5.2.4 5.7l15.9 15.6 5.5 22.6c.1.6.6 1 1.2 1.1h.2c.5 0 1-.3 1.3-.7l23.2-39c.4-.4.4-1 .1-1.5zM5.2 6.1h35.5L18 18.7 5.2 6.1zm18.7 33.6l-4.4-18.4L42.4 8.6 23.9 39.7z"
                        ></path>
                      </svg>
                    </div>
                  </div>
                  <div class="bookmark">
                    <div class="QBdPU rrUvL">
                      <svg
                        aria-label="Save"
                        class="_8-yf5"
                        fill="#262626"
                        height="24"
                        viewBox="0 0 48 48"
                        width="24"
                      >
                        <path
                          d="M43.5 48c-.4 0-.8-.2-1.1-.4L24 29 5.6 47.6c-.4.4-1.1.6-1.6.3-.6-.2-1-.8-1-1.4v-45C3 .7 3.7 0 4.5 0h39c.8 0 1.5.7 1.5 1.5v45c0 .6-.4 1.2-.9 1.4-.2.1-.4.1-.6.1zM24 26c.8 0 1.6.3 2.2.9l15.8 16V3H6v39.9l15.8-16c.6-.6 1.4-.9 2.2-.9z"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>
              
                <span class="caption">
                  <span id="cap-username" class="caption-username"><b>${post.username}</b></span>
                  <span class="caption-text" id="caption-text">
                    ${post.caption}</span
                  >
                </span>
                <span class="comment">
                  <span class="caption-username"><b>akhilboddu</b></span>
                  <span class="caption-text">Thank you</span>
                </span>
                <span class="comment">
                  <span class="caption-username"><b>imharjot</b></span>
                  <span class="caption-text"> Great stuff</span>
                </span>
                <span class="posted-time">${post.timestamp}</span>
              </div>
              <div class="add-comment">
                <input type="text" placeholder="Add a comment..." />
                <a class="post-btn">Post</a>
              </div>
            </div>
                        
              `
        )
        .join("");
    }
  }
  const app = new App();
  