// id : 660dc3ef41b20f7600cd3df5
/**Shiwen: this will be executed when viewPage is loading
 * It will display details of a run
 */
document.addEventListener('DOMContentLoaded', async function () {
  var contentDiv = document.getElementById('content');
  // first clear page
  contentDiv.innerHTML = '';
  const urlParams = new URLSearchParams(window.location.search);
  const runId = urlParams.get('id');
  const username = urlParams.get('username');
  const url = `http://127.0.0.1:3007/api/getOneRun/${runId}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const startLocation = await reverseGeocode(
      data.run.startLog,
      data.run.startLat
    );
    const endLocation = await reverseGeocode(
      data.run.destLog,
      data.run.destLat
    );

    // Xinru：changed the css of run-details
    var paragraph = document.createElement('div');
    paragraph.classList.add('run-details');
    paragraph.innerHTML = `
    <p class="owner">Owner: ${data.run.username}</p>
    <p class="start-location">Start Location: ${startLocation}</p>
    <p class="destination">Destnation: ${endLocation}</p>
    <p class="level">Level: ${getLevelLabel(data.run.level)}</p>
`;
    // insert different pictures depends on rainy chance
    if (data.run.rainyChance > 80) {
      var img = document.createElement('img');
      img.src = 'rainy.png';

      img.style.width = '100px'; 
      img.style.height = 'auto'; 

      var contentDiv = document.getElementById('content');
      
      contentDiv.appendChild(img);
    } else {
      var img = document.createElement('img');
      img.src = 'sun.png';

      img.style.width = '100px'; 
      img.style.height = 'auto'; 

      var contentDiv = document.getElementById('content');
      contentDiv.appendChild(img);
    }
    contentDiv.appendChild(paragraph);

    // buttons
    var joinButton = document.createElement('button');
    joinButton.textContent = 'Join this run';
    joinButton.addEventListener('click', function () {
      joinRun(data.run, username);
    });
    contentDiv.appendChild(joinButton);

    var backButton = document.createElement('button');
    backButton.textContent = 'Go Back';
    backButton.addEventListener('click', function () {
      window.history.back();
    });
    contentDiv.appendChild(backButton);

    var finishButton = document.createElement('button');
    finishButton.textContent = 'Finish';
    finishButton.addEventListener('click', function () {
      finishRun(runId);
    });
    contentDiv.appendChild(finishButton);
  } catch (error) {
    console.error(error);
  }
});

function getLevelLabel(level) {
  switch (level) {
    case 0:
      return 'Easy';
    case 1:
      return 'Medium';
    case 2:
      return 'Advanced';
    default:
      return 'Unknown';
  }
}

async function joinRun(run, username) {
  try {
    const newRun = {
      username: username,
      startLog: run.startLog,
      startLat: run.startLat,
      destLog: run.destLog,
      destLat: run.destLat,
      rainyChance: run.rainyChance,
      level: run.level,
      midpointCoordinates: run.midpointCoordinates,
      status: 'unfinished', 
    };

    // Insert new running records into the database
    const response = await fetch('http://127.0.0.1:3007/api/joinRun', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newRun),
    });

    const data = await response.json();
    alert('Joined the run successfully');
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to join the run due to an error.');
  }
}

async function finishRun(runId) {
  try {
    const response = await fetch(
      `http://127.0.0.1:3007/api/finishRun/${runId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    if (data.message === 'Run finished successfully') {
      alert('Run finished successfully');
    } else {
      alert('Failed to finish the run: ' + data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to finish the run due to an error.');
  }
}
