const weatherKey = 'da00df5f9074457dae8130711243103';
async function getWeather() {
  const apiUrl = `http://api.weatherapi.com/v1/forecast.json?key=${weatherKey}&q=Dundee&days=7&aqi=no&alerts=no`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const weatherData = await response.json();
    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

/** this function returns the chance of rainy for a day */
function getRainyChance(x) {
  return new Promise((resolve, reject) => {
    getWeather()
      .then((weatherData) => {
        resolve(weatherData.forecast.forecastday[x].day.daily_chance_of_rain);
      })
      .catch((error) => {
        console.error('Error getting weather data:', error);
        reject(error);
      });
  });
}
