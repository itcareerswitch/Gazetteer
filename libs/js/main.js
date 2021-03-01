//loader

function showPage() {
    document.getElementById("loader").style.display = "none";
    document.getElementById("main").style.display = "block";
}

function hidePage() {
    document.getElementById("loader").style.display = "block";
    document.getElementById("main").style.display = "none";
}


let searchOptions = $('#search');

searchOptions.empty();
searchOptions.append('<option selected="true" disabled>Choose a Country</option>');
searchOptions.prop('selectedIndex', 0);

$.getJSON("libs/json/countryBorders.geojson", function (countries) {
    $.each(countries.features, function (key, entry) {
        var country = entry.properties.name;
        var iso2 = entry.properties.iso_a2;
        searchOptions.append($('<option></option>').attr('value', iso2).text(country));
    })
});

let currencyDropdown = $('.currencyDropdown');

currencyDropdown.empty();
currencyDropdown.append('<option selected="true" disabled>Choose Currency</option>');
currencyDropdown.prop('selectedIndex', 0);

$.getJSON("libs/json/currencies.json", function (currencies) {
    $.each(currencies, function (key, entry) {
        currencyDropdown.append($('<option></option>').attr('value', entry.code).text(`${entry.name} (${entry.symbol})`));
    })
});

// Icons

var cityIcon = L.icon({
    iconUrl: 'libs/css/images/cityIcon.svg',
    iconSize: [28.5, 38.25],
    iconAnchor: [14.25, 38.25]
})

var touristIcon = L.icon({
    iconUrl: 'libs/css/images/touristIcon.svg',
    iconSize: [28.5, 38.25],
    iconAnchor: [14.25, 38.25]
})


// Setup map
let mymap = L.map('spaceMap', {
    minZoom: 2,
});
const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const tiles = L.tileLayer(tileUrl, { attribution });
tiles.addTo(mymap);

L.easyButton('fa-home', function (btn, map) {
    location.reload();
    }).addTo(mymap);

var markers;
var countryBorders;

var geojson;

var info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function (props) {
    this._div.innerHTML = '<h4>Country:</h4>' + (props ?
        '<b>' + props.name + '</b><br />' : 'Hover over a country');
};

info.addTo(mymap);


function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#A8EB12'
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    info.update(layer.feature.properties);
}

function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight
    });
}

var lat;
var lng;

mymap.addEventListener('dblclick', function (ev) {
    document.getElementById("search").value = "";
    lat = ev.latlng.lat;
    lng = ev.latlng.lng;
    getInfo();
});


function getPosition() {
    new Promise((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej)
    }).then((res) => {
        lat = res.coords.latitude;
        lng = res.coords.longitude;
    })
}

function getInfo() {
    hidePage();
    getPosition();
        $.ajax({
            type: 'POST',
            url: 'libs/php/getInfo.php',
            data: {
                country: $('#search option:selected').text(),
                iso: $('#search').val(),
                lng: lng,
                lat: lat
            },
            dataType: 'json',
            success: function (result) {

                console.log(result);

                if (result.status.name == "OK") {

                    //geoNames
                    var geoNames = result.geoNames.geonames[0];
                    $('#country').html(geoNames.countryName);
                    $('#currency').html(geoNames.currencyCode);
                    $('#capital').html(geoNames.capital);
                    $('#population').html(geoNames.population);
                    $('#area').html(geoNames.areaInSqKm);
                    $('#populationUnit').html('');
                    $('#areaUnits').html('');

                    //openCage
                    var openCage = result.openCage;

                    // restCountries
                    var restCountries = result.restCountries;
                    $('#flag').attr("src", restCountries.flag);
                    $('#symbol').html(restCountries.currencies[0].symbol);

                    document.getElementById("currency_from").value = restCountries.currencies[0].code; 

                    var openExchange = result.openExchange.rates;

                    const select = document.getElementById('exchange').querySelectorAll('select');
                    const input = document.getElementById('exchange').querySelectorAll('input');

                    function convert(i, j) {
                        input[i].value = (input[j].value * openExchange[select[i].value] / openExchange[select[j].value]).toFixed(2);
                    }

                    input[0].addEventListener('keyup', () => convert(1, 0));
                    input[1].addEventListener('keyup', () => convert(0, 1));
                    select[0].addEventListener('change', () => convert(1, 0));
                    select[1].addEventListener('change', () => convert(0, 1));

                    //geoNamesWiki
                    var geoNamesWiki = result.geoNamesWiki;
                    for (let j = 0; j < 30; j++) {
                        if (geoNamesWiki.geonames[j].feature == 'country' &&
                            (geoNamesWiki.geonames[j].countryCode == openCage.results[0].components["ISO_3166-1_alpha-2"] ||
                                geoNamesWiki.geonames[j].title.includes(openCage.results[0].components.country))) {
                            $('#summary').html(geoNamesWiki.geonames[j].summary);
                            $('#wikiLink').html(geoNamesWiki.geonames[j].wikipediaUrl).attr("href", "https://" + geoNamesWiki.geonames[j].wikipediaUrl);
                            break;
                        } else {
                            $('#summary').html('Beep Boop Beep! I can\t find the wikipedia page with the API! :-( \n Anyways here is more info on ' + openCage.results[0].components.country + ':');
                            $('#wikiLink').html('https://en.wikipedia.org/wiki/' + encodeURI(openCage.results[0].components.country)).attr("href", 'https://en.wikipedia.org/wiki/' + encodeURI(openCage.results[0].components.country));
                        }
                    }

                    //openWeather
                    var openWeather = result.openWeather;

                    document.querySelector("#country_weather").innerText = "Weather in " + openCage.results[0].components.country;

                    for (let i = 0; i < 2; i++) {

                        const description = openWeather.daily[i].weather[0].description;
                        const celsius_temp = (openWeather.daily[i].temp.day).toFixed(2);
                        const fahrenheit_temp = ((celsius_temp * 1.8) + 32).toFixed(2);
                        const speed_ms = (openWeather.daily[i].wind_speed).toFixed(2);
                        const speed_mph = (speed_ms * 2.237).toFixed(2);
                        const humidity = openWeather.daily[i].humidity;

                        document.querySelector('#tempUnits' + (i + 1)).style.display = "block";
                        document.querySelector('#windUnits' + (i + 1)).style.display = "block";
                        document.querySelector("#day_" + (i + 1) + "_icon").setAttribute('src', `http://openweathermap.org/img/wn/${openWeather.daily[i].weather[0].icon}@2x.png`);
                        document.querySelector("#day_" + (i + 1) + "_description").innerHTML = description;
                        document.querySelector("#day_" + (i + 1) + "_temp").style.display = "none";
                        document.querySelector("#day_" + (i + 1) + "_temp_celsius").style.display = "block";
                        document.querySelector("#day_" + (i + 1) + "_temp_celsius").innerHTML = celsius_temp;
                        document.querySelector("#day_" + (i + 1) + "_temp_fahrenheit").innerHTML = fahrenheit_temp;
                        document.querySelector("#day_" + (i + 1) + "_humidity").innerHTML = (humidity + " %");
                        document.querySelector("#day_" + (i + 1) + "_speed").style.display = "none";
                        document.querySelector("#day_" + (i + 1) + "_speed_ms").style.display = "block";
                        document.querySelector("#day_" + (i + 1) + "_speed_ms").innerHTML = speed_ms;
                        document.querySelector("#day_" + (i + 1) + "_speed_mph").innerHTML = speed_mph;
                    }

                    //map

                    var bounds;

                    if (geoNames) {
                        var bounds = [
                            [geoNames.north, geoNames.west],
                            [geoNames.south, geoNames.east]
                        ];
                    } else if (openCage.bounds) {
                        var bounds = [
                            [openCage.bounds.northeast.lat, openCage.bounds.northeast.lng],
                            [openCage.bounds.southwest.lat, openCage.bounds.southwest.lng]
                        ];
                    } else {
                        var bounds = null;
                    }

                    var cities = result.cities;

                    var tourists = result.tourists;

                    var iso = openCage.results[0].components["ISO_3166-1_alpha-3"];

                    var lat = openCage.results[0].geometry.lat;

                    var lng = openCage.results[0].geometry.lng;

                    makeMap(lat, lng, tourists, cities, iso, bounds);
                }
                    showPage();
            }
        });
};

    function degreeToggle() {
        if (document.getElementById('degree1').innerHTML == 'C') {
            for (let i = 0; i < 2; i++) {
                document.getElementById('degree' + (i + 1)).innerHTML = 'F';
                document.getElementById('speed' + (i + 1)).innerHTML = 'mph';
                document.querySelector("#day_" + (i + 1) + "_temp_fahrenheit").style.display = "block";
                document.querySelector("#day_" + (i + 1) + "_speed_mph").style.display = "block";
                document.querySelector("#day_" + (i + 1) + "_temp_celsius").style.display = "none";
                document.querySelector("#day_" + (i + 1) + "_speed_ms").style.display = "none";
            }
        } else {
            for (let i = 0; i < 2; i++) {
                document.getElementById('degree' + (i + 1)).innerHTML = 'C';
                document.getElementById('speed' + (i + 1)).innerHTML = 'm/s';
                document.querySelector("#day_" + (i + 1) + "_temp_fahrenheit").style.display = "none";
                document.querySelector("#day_" + (i + 1) + "_speed_mph").style.display = "none";
                document.querySelector("#day_" + (i + 1) + "_temp_celsius").style.display = "block";
                document.querySelector("#day_" + (i + 1) + "_speed_ms").style.display = "block";
            }
        }
}

function makeMap(lat, lng, tourists, cities, iso, bounds) {

    if (markers || countryBorders || geojson) {
        markers.clearLayers();
        countryBorders.clearLayers();
        geojson.clearLayers();
    }

    mymap.setView(new L.LatLng(lat, lng), 12);
    window.setTimeout(function () {
        mymap.invalidateSize();
    }, 1000);
    

    if (bounds) {
        mymap.fitBounds(bounds);
    }
    
    $.getJSON('libs/json/countryBorders.geojson', function (countries) {
        function style(feature) {
            if (feature.properties.iso_a3 === iso) {
                return { color: '#1C253C' }
            } else {
                return { color: 'transparent' }
            }
        }
        geojson = L.geoJSON(countries, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(mymap);
        var geojsonFeature = countries.features.filter(country => country.properties.iso_a3 === iso);
        countryBorders = L.geoJSON(geojsonFeature, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(mymap);
    });


    markers = L.markerClusterGroup();

    //Tourists
    for (let i in tourists.searchResults) {
        markers.addLayer(
            L.marker([tourists.searchResults[i].fields.lat, tourists.searchResults[i].fields.lng], { icon: touristIcon })
                .bindTooltip(tourists.searchResults[i].name)
        )
    }

    // Cities
    for (let i in cities.data) {

        markers.addLayer(
            L.marker([cities.data[i].latitude, cities.data[i].longitude], {
                icon: cityIcon
            }).bindTooltip(cities.data[i].name)
        )
    }

    mymap.addLayer(markers);

}

$('#submitBtn').click(getInfo());