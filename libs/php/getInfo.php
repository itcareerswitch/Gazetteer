<?php
 
	$executionStartTime = microtime(true) / 1000;

        if ($_REQUEST['iso'] == "") {
        $url_4a = 'https://api.opencagedata.com/geocode/v1/json?q='.$_REQUEST['lat'].'+'.$_REQUEST['lng'].'&key=bf4c62e6d078444ca0e0324114a08b16';

        $ch = curl_init();
	    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

	    curl_setopt($ch, CURLOPT_URL, $url_4a);
        $openCage = curl_exec($ch);

        curl_close($ch);

        $openCage = json_decode($openCage, true);

        $country = $openCage['results'][0]['components']['country'];
        $iso = $openCage['results'][0]['components']['ISO_3166-1_alpha-2'];

    }  else {
        $country = $_REQUEST['country'];
        $iso = $_REQUEST['iso'];
    }

	$url_1 ='http://api.geonames.org/countryInfoJSON?formatted=true&lang=en&country='. $iso.'&username=loradennys01&style=full';
    $url_2 = 'https://restcountries.eu/rest/v2/alpha/'.$iso;
    $url_3 = 'https://openexchangerates.org/api/latest.json?app_id=f0ddae51e6fa49379e6e0c16c576eb86';
	$url_4b = 'https://api.opencagedata.com/geocode/v1/json?q='.urlencode($country).'&key=bf4c62e6d078444ca0e0324114a08b16';
    $url_5 = 'http://api.geonames.org/wikipediaSearchJSON?q='.urlencode($country).'&maxRows=30&username=loradennys01';
   
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

	curl_setopt($ch, CURLOPT_URL, $url_1);
    $geoNames = curl_exec($ch);

	curl_setopt($ch, CURLOPT_URL, $url_2);
    $restCountries = curl_exec($ch);

	curl_setopt($ch, CURLOPT_URL, $url_3);
    $openExchange = curl_exec($ch);

	curl_setopt($ch, CURLOPT_URL, $url_4b);
    $openCage = curl_exec($ch);

    curl_setopt($ch, CURLOPT_URL, $url_5);
    $geoNamesWiki = curl_exec($ch);

    	curl_setopt_array($ch, array(
        CURLOPT_URL => "https://wft-geo-db.p.rapidapi.com/v1/geo/cities?limit=10&countryIds=".$_REQUEST['iso']."&sort=-population&types=CITY",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_ENCODING => "",
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => "GET",
        CURLOPT_HTTPHEADER => array(
            	"x-rapidapi-key: 4cf1d52322msh2b233f262b047a9p1a73e7jsncce3d605c8a2",
	            "x-rapidapi-host: wft-geo-db.p.rapidapi.com",
        ),
    ));              

    $cities = curl_exec($ch);

    curl_close($ch);
	
    $geoNames = json_decode($geoNames, true);
    $restCountries = json_decode($restCountries, true);
    $openExchange = json_decode($openExchange, true);
    $openCage = json_decode($openCage, true);
    $geoNamesWiki = json_decode($geoNamesWiki, true);
    $cities = json_decode($cities, true);

    $lat = $openCage['results'][0]['geometry']['lat'];
    $lng = $openCage['results'][0]['geometry']['lng'];
    
	$url_6 = 'http://api.openweathermap.org/data/2.5/onecall?lat='.$lat.'&lon='.$lng.'&exclude=hourly&units=metric&appid=9d21adbaf29b1b1269b5d0eb5af76f9e';
    $url_7 = 'http://www.mapquestapi.com/search/v2/radius?key=Am7bvFuCecbRUsKMaCX3ETSQRucItYFU&maxMatches=10&units=m&radius=200&origin='.$lat.','.$lng;

    $ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

	curl_setopt($ch, CURLOPT_URL, $url_6);
    $openWeather = curl_exec($ch);

    curl_setopt($ch, CURLOPT_URL, $url_7);
    $tourists = curl_exec($ch);

    curl_close($ch);
    
    $openWeather = json_decode($openWeather, true);
    $tourists = json_decode($tourists, true);
    

    // Final Output
	$output['status']['code'] = "200";
    $output['status']['name'] = "OK";
    $output['geoNames'] = $geoNames;
    $output['restCountries'] = $restCountries;
    $output['openExchange'] = $openExchange;
    $output['openCage'] = $openCage;
    $output['geoNamesWiki'] = $geoNamesWiki;
    $output['cities'] = $cities;
    $output['openWeather'] = $openWeather;
    $output['tourists'] = $tourists;
    
   
    $output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000000 . " ms";

	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output);

?>





