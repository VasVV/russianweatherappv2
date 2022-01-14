import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import RussianCities from './russian-cities';

const containerStyle = {
  width: '100vw',
  height: '100vh'
};

const center = {
    lat: 59.934280,
    lng: 30.335098
};

const bigCityLimit = 4000000;

export default function App() {

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
  })

  const [map, setMap] = useState(null);
  const [zoom, setZoom] = useState(10);
  const [toggleBigCitiesWeather, setToggleBigCitiesWeather] = useState(false);
  const [bigCities, setBigCities] = useState([]);
  const [clickLatLng, setClickLatLng] = useState(null);
  const [weatherOnClick, setWeatherOnClick] = useState({});
  const [initialPageVisible, setInitialPageVisible] = useState(true);

  const onLoad = useCallback(function callback(map) {
    const bounds = new window.google.maps.LatLngBounds();
    map.fitBounds(bounds);
    setMap(map);
  }, [])

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  useEffect(async() => {
    let getBigCities = RussianCities
    .filter(e => e.population >= bigCityLimit)
    let res = await Promise.all(getBigCities.map(async e => {
      const lat = Number(e.coords.lat);
      const lon = Number(e.coords.lng);
      const weather = await getWeather(lat, lon);
      return {
        ...e,
        weather
      }
    }));
    setBigCities(res);
  },[]);

  useEffect(() => {
    if (zoom >= 8) {
      setToggleBigCitiesWeather(true);
    } else {
      setToggleBigCitiesWeather(false)
    }
  }, [zoom]);

  useEffect(async () => {
    const res = await getWeather();
    setWeatherOnClick(res);
  },[clickLatLng]);

  const getWeather = async(f, s) => {
    let lat, lon;
    if (!f && clickLatLng) {
      lat = clickLatLng.lat();
      lon = clickLatLng.lng();
    } else {
      lat = f;
      lon = s;
    }
    const data = {lat, lon};
    const response = await axios.post('http://localhost:3001/recieveweather', data);
    return response.data;
  }

  const onCloseClick = () => {
    setClickLatLng(null);
    setWeatherOnClick({});
    setInitialPageVisible(true);
  }

  const gr = temp => {
    if ( temp.toString().split('').pop() === '1') {
      return 'градус';
    }
    else if ((temp % 2 === 0 || temp % 3 === 0 || temp % 4 === 0) && temp !== 0) {
      return 'градуса'
    } 
    else return 'градусов';
  };

  const cloudness = cloudness => {
    switch(cloudness) {
      case 0:
        return 'ясно';
      case 0.25:
        return 'малооблачно';
      case 0.5:
        return 'облачно с прояснениями';
      case 0.75:
        return 'облачно с прояснениями';
      default:
        return 'пасмурно';
    }
  }

  const precipitate = precipitate => {
    switch(precipitate) {
      case 1:
        return 'без осадков';
      case 2:
        return 'дождь';
      case 3:
        return 'дождь со снегом';
      default:
        return 'град';
    }
  }

  return (
    <div className="App">
      {
      isLoaded ? (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={6}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onZoomChanged={() => setZoom(map?.getZoom())}
          onClick={(e) => setClickLatLng(e.latLng)}
        >
          { toggleBigCitiesWeather && bigCities.map(e => {
            return (
              <InfoWindow
                key={e.name}
                position={{lat: Number(e.coords.lat), lng: Number(e.coords.lng)}}
                >
                  <div className="weather-tooltip-big-city">
                    <h4>Погода сейчас</h4>
                    <p>Температура: {e.weather?.fact.temp} {gr(e.weather?.fact.temp)}</p>
                    <p>Облачность: {cloudness(e.weather?.fact.cloudness)}</p>
                  </div>
              </InfoWindow>
            )
          }) }

          { clickLatLng && 
              <InfoWindow
                position={{lat: Number(clickLatLng.lat()), lng: Number(clickLatLng.lng())}}
                onCloseClick={() => onCloseClick()}
                > 
                  <div className="weather-tooltip">
                    <button onClick={() => setInitialPageVisible(!initialPageVisible)}>{'<'}</button>
                    <button onClick={() => setInitialPageVisible(!initialPageVisible)}>{'>'}</button>
                    <div className={initialPageVisible ? 'weather-tooltip__first-page__visible' : 'weather-tooltip__first-page__hidden'}>
                      <h4>Погода сейчас</h4>
                      <p>Температура: {weatherOnClick.fact?.temp} </p>
                      <p>Облачность: {cloudness(weatherOnClick.fact?.cloudness)}</p>
                    </div>
                    <div className={!initialPageVisible ? 'weather-tooltip__first-page__visible' : 'weather-tooltip__first-page__hidden'}>
                      <h4>Погода завтра</h4>
                      {Object.keys(weatherOnClick).length !== 0 && 
                        <>
                          <p>Средняя температура днем: {weatherOnClick?.forecasts[1].parts.day.temp_avg} </p>
                          <p>Осадки: {precipitate(weatherOnClick?.forecasts[1].parts.day.prec_type)}</p>
                        </>
                      }
                    </div>
                  </div>
              </InfoWindow>  
          }
          <></>
        </GoogleMap>
    ) : <></>
    }
    </div>
  );
}


