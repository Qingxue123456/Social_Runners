//OpenRouteService API Key.
//Yuanzhe: 5b3ce3597851110001cf624881c2a83809e643979196804e40f881b6
//Shiwen: 5b3ce3597851110001cf62489873755d2e39415b85d02b24744358ce
//Shuqing: 5b3ce3597851110001cf6248fe2d7ee851ad4938bb74e5b0bc79c957
const routeKey = '5b3ce3597851110001cf6248fe2d7ee851ad4938bb74e5b0bc79c957';
const fromInput = document.getElementById('from_places');
const toInput = document.getElementById('to_places');
const fromButton = document.getElementById('from_button');
const toButton = document.getElementById('to_button');
const originDrop = document.getElementById('origin_drop');
const destinationDrop = document.getElementById('destination_drop');

const eventForm = document.getElementById('distance_form');
const midButt = document.getElementById('add_mid');
const speedDiv = document.getElementById('velocity');

// a hashmap, key = log & lat, value = name of a place
const locationCoordinatesMap = {};

/** Shiwen: This event will be triggered when user attempts to edit location */
function displayOptions(input, drop, button) {
  button.addEventListener('click', function () {
    const userInput = input.value.trim(); // trim white spaces
    if (userInput) {
      geocode(userInput)
        .then((coordinates) => {
          return Promise.all(
            coordinates.map((coordinate) => {
              return reverseGeocode(coordinate[0], coordinate[1]).then(
                (address) => {
                  // Update hashmap
                  if (!locationCoordinatesMap[address]) {
                    locationCoordinatesMap[
                      address
                    ] = `${coordinate[0]},${coordinate[1]}`;
                  } else {
                    locationCoordinatesMap[
                      address
                    ] += `,${coordinate[0]},${coordinate[1]}`;
                  }
                  return address;
                }
              );
            })
          );
        })
        .then((addresses) => {
          drop.innerHTML = '';

          // display options
          addresses.forEach((address) => {
            const optionElement = document.createElement('div');
            optionElement.classList.add('autocomplete-option');
            optionElement.textContent = address;
            // when click the option, its content will be filled into input
            optionElement.addEventListener('click', function () {
              input.value = address;
              drop.innerHTML = '';
            });
            drop.appendChild(optionElement);
          });

          drop.style.display = 'block';
        })
        .catch((error) => {
          console.error('Error fetching options:', error);
        });
    } else {
      drop.style.display = 'none';
    }
  });

  // if user click other places of the web page, hide options
  document.addEventListener('click', function (event) {
    if (!event.target.matches(`#${input.id}`)) {
      drop.style.display = 'none';
    }
  });
}

/**Yuanzhe add midpoint, using geocode to search the midpoint AND generate a dropdown list*/
midButt.addEventListener('click', displayMidPointDiv);
function displayMidPointDiv() {
  //When click the midButt, create a new division in the form
  let middle_div = document.createElement('div');

  let middle_label = document.createElement('label');
  middle_label.textContent = 'Middle Point:';

  let input_1 = document.createElement('input');
  input_1.id = 'mid_places';
  input_1.placeholder = 'Enter a Location';
  input_1.required = true;
  input_1.classList.add('midpoints');

  let mid_button = document.createElement('button');
  mid_button.id = 'md_button';
  mid_button.textContent = 'Search';

  let mid_drop_div = document.createElement('div');
  mid_drop_div.id = 'middlePoint_drop';

  let mid_hid_input = document.createElement('input');
  mid_hid_input.id = 'middlePoint';
  mid_hid_input.type = 'hidden';
  mid_hid_input.name = 'middlePoint';
  mid_hid_input.required = true;

  middle_div.appendChild(middle_label);
  middle_div.appendChild(input_1);
  middle_div.appendChild(mid_button);
  middle_div.appendChild(mid_drop_div);
  middle_div.appendChild(mid_hid_input);
  //https://stackoverflow.com/questions/31786796/how-to-add-new-div-before-another
  eventForm.insertBefore(middle_div, speedDiv);

  displayOptions(input_1, mid_drop_div, mid_button);
}

displayOptions(fromInput, originDrop, fromButton);
displayOptions(toInput, destinationDrop, toButton);

/**Shiwen: This function change user input location (name of a place) to geocode(float)
 * Note that it will return a series of potential geocode
 * Yuanzhe: in Leaflet, it uses (log, lat) format!
 */
function geocode(location) {
  return fetch(
    `https://api.openrouteservice.org/geocode/search?api_key=${routeKey}&text=${location}`
  )
    .then((response) => response.json())
    .then((data) => {
      const coordinates = data.features.map((feature) => {
        return feature.geometry.coordinates;
      });
      return coordinates;
    })
    .catch((error) => {
      console.error('Error fetching geocode data:', error);
    });
}

/**Shiwen: This function will change geocode to location name */
function reverseGeocode(lon, lat) {
  const url = `https://api.openrouteservice.org/geocode/reverse?api_key=${routeKey}&point.lon=${lon}&point.lat=${lat}&size=1`;
  return fetch(url)
    .then((response) => response.json())
    .then((data) => {
      const address = data.features.map((feature) => {
        return feature.properties.label;
      });
      return address;
    })
    .catch((error) => {
      console.error('Error fetching reverse geocode data:', error);
    });
}
