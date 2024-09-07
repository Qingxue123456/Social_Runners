// Register
function signUp() {
  const username = document.getElementById('name').value;
  const password = document.getElementById('password').value;
  const age = document.getElementById('age').value;
  const email = document.getElementById('email').value;
  // Get the values of the selected checkboxes
  const difficultyInputs = document.getElementsByName('difficulty');
  let difficultyValue;
  for (let i = 0; i < difficultyInputs.length; i++) {
    if (difficultyInputs[i].checked) {
      const difficulty = difficultyInputs[i].value;
      // Convert the selected difficulty level to the corresponding numerical value
      switch (difficulty) {
        case 'basic':
          difficultyValue = 0;
          break;
        case 'medium':
          difficultyValue = 1;
          break;
        case 'advanced':
          difficultyValue = 2;
          break;
      }
      break; // Exit the loop after finding the selected item
    }
  }
  const userData = {
    username,
    password,
    age,
    email,
    difficulty: difficultyValue,
  };

  // Using the Fetch API to send a registration request
  fetch('http://127.0.0.1:3007/api/registeruser', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })
    .then((response) => response.json())
    .then((data) => {
      // If registration is successful
      if (data.status === 0) {
        alert('Registration successful');
        window.location.href = './index.html';
      } else {
        // If registration fails
        alert(`Registration failed: ${data.message}`);
      }
    })
    .catch((error) => {
      console.error('Error', error);
      alert('Registration failed due to an error. Please try again.');
    });
}

// Login
function login() {
  const username = document.getElementById('userName').value;
  const password = document.getElementById('passwordLogin').value;
  const userData = { username, password };
  // Using the Fetch API to send a login request
  fetch('http://127.0.0.1:3007/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })
    .then((response) => response.json())
    .then((data) => {
      // If login is successful
      if (data.status === 0) {
        alert('Login successful');

        currentUserName = data.userName;
        userDifficulty = data.difficulty;
        console.log(currentUserName);
        // Hide LoginPage
        const loginPageToHide = document.getElementById('LoginPage');
        loginPageToHide.style.display = 'none';
        // Show dashboardPage
        const dashboardPageToShow = document.getElementById('dashboardPage');
        dashboardPageToShow.style.display = 'block';
        loadTopRuns();
      } else {
        // If login fails
        alert(`Login failed: ${data.message}`);
      }
    })
    .catch((error) => {
      console.error('Error', error);
      alert('Login failed due to an error. Please try again.');
    });
}

// Using token to send requests
function fetchProtectedData() {
  const token = localStorage.getItem('token');
  fetch('http://127.0.0.1:3007/api/protected', {
    method: 'GET',
    headers: {
      Authorization: token,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log('Protected data:', data);
    })
    .catch((error) => {
      console.error('Error fetching protected data:', error);
    });
}

//Map Leaflet OpenStreetMap OpenRouteService
let map = L.map('map').setView([51.505, -0.09], 13); //https://leafletjs.com/reference.html#map-example Leaflet Map intialisation document

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map); //Add reference to the map

//this will be called when user change date
let selectedDateIndex, selectedDate;
document.getElementById('selectDate').addEventListener('change', function () {
  selectedDateIndex = parseInt(this.value); // 解析选定的日期索引
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + selectedDateIndex);
  selectedDate = formatDate(currentDate);
  document.getElementById(
    'weather'
  ).innerText = `Plan Run date: ${selectedDate}`;
});

/** Route planning
 * This function will be called when user filled the form and press Plan Run button
 */
function routePlanning() {
  /** TODO:
   * 1. use array elements to keep all the midpoints
   * 2. change the input of addNewRun to addNewRun(elements)
   * 3. fori, push to database
   */

  const fromInputElement = document.getElementById('from_places');
  const toInputElement = document.getElementById('to_places');

  const fromPlace = fromInputElement.value.trim();
  const toPlace = toInputElement.value.trim();

  // Get log and lat by names (search in hashmap)
  const startCoordinate = locationCoordinatesMap[fromPlace];
  const destCoordinate = locationCoordinatesMap[toPlace];
  const startLog = startCoordinate.split(',')[0];
  const startLat = startCoordinate.split(',')[1];
  const destLog = destCoordinate.split(',')[0];
  const destLat = destCoordinate.split(',')[1];
  let distance;

  const startPoint_geo = `${startLog},${startLat}`;
  const endPoint_geo = `${destLog},${destLat}`;
  const midpointsElements = document.querySelectorAll('.midpoints');
  const midpoints = getCoordinates(midpointsElements);

  //Openrouteservice API: /v2/directions/{profile}/geojson
  fetch(`https://api.openrouteservice.org/v2/directions/foot-hiking/geojson`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: '5b3ce3597851110001cf624881c2a83809e643979196804e40f881b6',
    },
    body: JSON.stringify({
      coordinates: [
        [parseFloat(startLog), parseFloat(startLat)],
        ...midpoints.map((midpoint) => [
          parseFloat(midpoint.log),
          parseFloat(midpoint.lat),
        ]),
        [parseFloat(destLog), parseFloat(destLat)],
      ],
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      distance = data.features[0].properties.summary.distance;
      console.log('distance: ', distance);
      let myLayer = L.geoJSON().addTo(map);
      myLayer.addData(data);

      //https://mourner.github.io/Leaflet/reference.html#latlngbounds
      map.fitBounds(myLayer.getBounds()); //https://stackoverflow.com/questions/46459688/leaflet-getbounds-errors
      // https://gis.stackexchange.com/questions/180678/how-do-i-get-the-bounds-of-a-layergroup-in-leaflet

      // add route info to database

      addNewRun(
        startLog,
        startLat,
        destLog,
        destLat,
        distance,
        midpointsElements,
        selectedDate
      );
    });
  // add marker to the map
  L.marker([startLat, startLog]).addTo(map);
  L.marker([destLat, destLog]).addTo(map);
}

document.getElementById('navButt').addEventListener('click', routePlanning);

setInterval(function () {
  map.invalidateSize();
}, 100);

/**this function will search all text boxes,
 * if has a value, find log and lat in the hashmap
 * then push result in an array and return
 *
 * This function is used in addNewRun
 */
function getCoordinates(midpoints) {
  const coordinatesArray = [];

  midpoints.forEach((midpoint) => {
    const location = midpoint.value;
    if (location !== '') {
      const coordinate = locationCoordinatesMap[location];
      if (coordinate) {
        const [log, lat] = coordinate.split(',');
        coordinatesArray.push({ log, lat });
      } else {
        console.error(`Coordinates not found for location: ${location}`);
      }
    }
  });
  console.log('Coordinates array length:', coordinatesArray.length);
  return coordinatesArray;
}

/**
 * This function will add run to database runs
 * It will be called after user filled start and end location and press the button
 */
async function addNewRun(
  startLog,
  startLat,
  destLog,
  destLat,
  distance,
  midpoints,
  selectedDate
) {
  try {
    const username = document.getElementById('userName').value;
    const rainyChance = await getRainyChance(0);
    const level = levelOfRun(distance);
    const midpointCoordinates = getCoordinates(midpoints);
    const runDetails = {
      username,
      startLog,
      startLat,
      destLog,
      destLat,
      rainyChance,
      distance,
      level,
      midpointCoordinates,
      status: 'unfinished',
      selectedDate,
    };

    const response = await fetch('http://127.0.0.1:3007/api/addNewRun', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(runDetails),
    });

    const data = await response.json();
    if (data.message === 'New run created successfully') {
      alert('New run created successfully');
    } else {
      alert('Failed to create new run: ' + data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to create new run due to an error.');
  }
}

/**
 * 0-5000 is easy(0)
 * 5001-10000 is medium(1)
 * 10000+ is advanced(2)
 */
function levelOfRun(distance) {
  if (distance >= 0 && distance <= 5000) {
    return 0;
  } else if (distance > 5000 && distance <= 10000) {
    return 1;
  } else {
    return 2;
  }
}

/**
 * this function will be called after user login(so in homepage)
 * Load runs and display
 */
// Change the join button to a check button and add styles.
async function loadTopRuns() {
  try {
    const response = await fetch('http://127.0.0.1:3007/api/loadTopRuns');
    const data = await response.json();

    if (data && data.runs && data.runs.length > 0) {
      const userDataContainer = document.getElementById('user_data_container');
      const recommendContainer = document.getElementById(
        'recommend_data_container'
      );
      userDataContainer.innerHTML = '';

      // display runs
      for (const run of data.runs) {
        const runElement = document.createElement('div');
        runElement.classList.add('run');

        const usernameElement = document.createElement('p');
        usernameElement.textContent = 'Owner: ' + run.username;

        // start and end location
        const startLocation = await reverseGeocode(run.startLog, run.startLat);
        const startLocationElement = document.createElement('p');
        startLocationElement.textContent = 'Start position: ' + startLocation;

        const endLocation = await reverseGeocode(run.destLog, run.destLat);
        const endLocationElement = document.createElement('p');
        endLocationElement.textContent = 'End position: ' + endLocation;

        // Add distance information
        const distanceElement = document.createElement('p');
        distanceElement.textContent = 'Distance: ' + run.distance;

        // Add date information
        const dateElement = document.createElement('p');
        dateElement.textContent = 'Date: ' + run.selectedDate;

        const checkButton = document.createElement('button');
        checkButton.textContent = 'Check';
        checkButton.classList.add('check');
        // add run id to the button
        checkButton.setAttribute('_id', run._id);
        console.log('loadTopruns username:', currentUserName);
        // click the button, navigate to another page to display detailed information about the run
        checkButton.addEventListener('click', function () {
          const runId = this.getAttribute('_id');
          window.location.href = `viewPage.html?id=${runId}&username=${currentUserName}`;
        });

        runElement.appendChild(usernameElement);
        runElement.appendChild(startLocationElement);
        runElement.appendChild(endLocationElement);
        runElement.appendChild(distanceElement);
        runElement.appendChild(dateElement);
        runElement.appendChild(checkButton);
        if (run.status === 'finished') {
          // In history we don't want to display the run of others
          if (run.username === currentUserName) {
            userDataContainer.appendChild(runElement);
          }
        } else {
          // Only recommend runs at the same level as user
          if (run.level === userDifficulty) {
            recommendContainer.appendChild(runElement);
          }
        }
      }
    } else {
      alert('No runs found.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to load user data due to an error.');
  }
}



/*
1. Initialize a run 
2. Submit a user message once 
3. After mentioning the message, the page jumps to other users’ messages*/ 
//Initialize running function
function createRun() {
  document.getElementById('modalClick').addEventListener('click', function () {
    //console.log('Binding event listener');
    const origin = document.getElementById('from_places').value;
    const destination = document.getElementById('to_places').value;
    const pace = document.getElementById('paceMiles').value;
    //。。。。。。
    const runDetails = {
      origin: origin,
      destination: destination,
      pace: pace,
    };
    fetch('http://127.0.0.1:3007/api/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        
      },
      body: JSON.stringify(runDetails),
    })
      .then((response) => response.json())
      .then((data) => {
        const runId = data.runId; 
        document.getElementById('submitComment').onclick = function () {
          submitComment(runId);
          console.log(runId); /////undefined
          document.getElementById('commentForm').style.display = 'none';
          document.getElementById('commentsList').style.display = 'block';
        };
      })
      .catch((error) => {
        console.error('Wrong:', error);
      });
  });
}

//createRun();


// user leave comments
function submitComment(runId) {
  const comment = document.getElementById('commentInput').value;
  const username = document.getElementById('name').value;

  fetch('http://127.0.0.1:3007/api/comment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      runId,
      username,
      comment,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === 0) {
        alert('Comment added successfully');
        loadComments(runId); 
      } else {
        alert('Failed to add comment: ' + data.message);
      }
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('Failed to add comment due to an error.');
    });
}

function loadComments(runId) {
  fetch(`http://127.0.0.1:3007/api/comments/${runId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.status === 0) {
        const commentsList = document.getElementById('commentsList');
        commentsList.innerHTML = '<h3>Comments</h3>'; 
        data.comments.forEach((comment) => {
          const commentElement = document.createElement('div');
          commentElement.textContent = `${comment.username}: ${comment.comment}`;
          commentsList.appendChild(commentElement);
        });
      } else {
        alert('Failed to load comments: ' + data.message);
      }
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('Failed to load comments due to an error.');
    });
}
