/* File: main.js
 * Purpose: SCC Challenge
 * Description: Write some JS that brings in Google Maps which shows the location
 *              of the nearest SCC to the user 
 *
 */

    var sccChallenge = {

        /*
         *
         */
        init : function () {
            
            /* Global Object Variables */ 
            this.geolocationStatus = false;
            this.mainContainerClassName = 'scc-challenge';
            this.map; 
            this.mapid = "map";
            this.position;
            this.locationLoopLimit = 50;
            this.mapLoadLoopLimit = 50;
            this.mapHeight = 400; 
            this.placesNameFilter = 'Service Canada Centre';
            this.autocomplete; 
            
            /* Functions */ 
            this.drawTheSkeleton(); 
            this.drawTheMap(); 
            this.drawTheForm();
            
            this.checkLocationServices();  
        },
        
        /*
         * Draw the skeleton and Cache the dom 
         * so that we don't 
         * have to keep asking
         * jquery about stuff 
         */
        drawTheSkeleton : function () {
            
            this.document = $(document);
            this.mainContainer = this.document.find('.' + this.mainContainerClassName);
            
            /* Empty the main container */ 
            this.mainContainer.empty();
            
            /* This is what we are putting in the dom: 
                <div class="scc-message"></div>
                <div class="scc-form"></div>
                <div class="scc-map"></div>
                <div class="scc-results"></div>
            */
            
            /* Draw the message container */ 
            jQuery('<div/>', {
                class: 'scc-message'
            }).appendTo(this.mainContainer);
            
            /* Draw the form container */ 
            jQuery('<div/>', {
                class: 'scc-form'
            }).appendTo(this.mainContainer);
            
            /* Draw the map container */ 
            jQuery('<div/>', {
                class: 'scc-map'
            }).appendTo(this.mainContainer);
            
            /* Draw the map container */ 
            jQuery('<div/>', {
                class: 'scc-results'
            }).appendTo(this.mainContainer);
            
            /* Cache the container objects */
            this.messageContainer = this.document.find('.scc-message');
            this.formContainer = this.document.find('.scc-form');
            this.mapContainer = this.document.find('.scc-map');
            this.resultsContainer = this.document.find('.scc-results');
            
        },
        
        /*
         * Draw the map container 
         */
        drawTheMap : function () {
            
            var mapSubContainer = document.createElement('div');
            mapSubContainer.id = this.mapid;
            mapSubContainer.setAttribute("style", "height: " + this.mapHeight.toString() + "px;")
            
            this.mapContainer.append(mapSubContainer);
            
            var initialLocation = {lat: 54.995264, lng: -96.389650};
    
            /* Draw the map */ 
            this.map = new google.maps.Map(document.getElementById(this.mapid), {
                center: initialLocation,
                fullscreenControl: false,
                streetViewControl: false,
                mapTypeControl: false,
                zoom: 4
            });

            
        },
        
        /*
         * Draw the form objects
         */
        drawTheForm : function () {
            
            /* This is what we are putting in the dom: 
            
                <div class="well">
                <form class="form-inline" role="form" method="get" action="#">
                  <div class="form-group">
                    <label class="wb-inv" for="exampleInputEmail2">Enter your location</label>
                    <input type="email" class="form-control" id="exampleInputEmail2" placeholder="Enter a location" />
                  </div>
                  <button type="submit" class="btn btn-primary">Find a centre</button>
                </form>
                <span id="sccMapMessage"></span>
                </div>
            
            */
            
            var formWell = document.createElement('div');
            formWell.classList.add("well");
            
            var formForm = document.createElement('form');
            formForm.classList.add("form-inline");
            
            var formGroup = document.createElement('div');
            formGroup.classList.add("form-group");
            
            jQuery('<label/>', {
                class: 'wb-inv',
                for: 'userlocation',
                text: 'Enter your location'
            }).appendTo(formGroup);
            
            jQuery('<input/>', {
                type: 'text',
                class: 'form-control mrgn-rght-sm',
                id: 'userlocation',
                placeholder: 'Enter a location'
            }).appendTo(formGroup);
            
            formForm.appendChild(formGroup);
            
            jQuery('<button/>', {
                class: 'btn btn-primary',
                id: 'sccSubmitButton',
                type: 'submit',
                text: 'Find a centre'
            }).appendTo(formForm);
            
            formWell.appendChild(formForm);
            
            /* Add the form to the dom */ 
            this.formContainer.append(formWell);
            
            /* Create Google's AutoComplete Object */ 
            this.autocomplete = new google.maps.places.Autocomplete(
            /** @type {!HTMLInputElement} */(document.getElementById('userlocation')),
            {
                types: ['geocode'], 
                componentRestrictions: {country: "ca"}
            });
            
            /* Add the event listener for when someone hits 'enter' or clicks submit */ 
            this.formContainer.find('#sccSubmitButton').on('click', this.locationFormSubmitHandler.bind(this)); 
            
//            this.autocomplete.addListener('place_changed', this.locationFormSubmitHandler.bind(this));

        },
        
        
        /*
         *
         */
        locationFormSubmitHandler : function (event) {
            
            /* Disable the default Form Submit Action */ 
            event.preventDefault();
            
            var geocoder = new google.maps.Geocoder();
            
            geocoder.geocode({ 
                                 
                'address': document.getElementById('userlocation').value,
                'region' : "CA"
                
            }, function (results, status) {

                /* The code below only gets run after a successful Google service call has completed. Because this is an asynchronous call, the validator has already returned a 'true' result to supress an error message and then cancelled the form submission.  The code below needs to fetch the true validation from the Google service and then re-execute the jQuery form validator to display the error message.  Futhermore, if the form was 
                being submitted, the code below needs to resume that submit. */

                // Google reported a valid geocoded address
                if (status == google.maps.GeocoderStatus.OK) {
                    
                    this.geolocationStatus = true;

                    console.log("Valid GeoCode = " + status);
                    
                    this.clearMessage(); 
                    
                    
                    if ( results.length == 1 ) { 
                        
                        /* Move the map */ 
                        this.updateMapCentrePosition(results[0].geometry.location.lat(), results[0].geometry.location.lng())
                        
                        /* Search for places around the location */ 
                        this.searchForSCCPlaces(results[0].geometry.location.lat(), results[0].geometry.location.lng()); 
                                   
                    }
                    else { 
                        /* if we get multiple results throw an error */
                        this.writeErrorMessage("Please be more specific when providing location!");
                    }
                    
                    console.log("Number of results: " + results.length ); 
                    
                }
                else { 
                    
                    /* Show an error message */ 
                    this.writeErrorMessage("Not a valid address");
                }
                
            }.bind(this));
            
        },
        
        /*
         *
         */
        updatePositionEvent : function () {
            
            var place = this.autocomplete.getPlace();
            
            console.log("Got a place fire");

            console.log (place); 
            
        },
        
        
        /*
         *
         */
        checkLocationServices : function () {
            
            var geo_options = {
              enableHighAccuracy: true, 
              maximumAge        : 30000, 
              timeout           : 27000
            };
            
            if ("geolocation" in navigator) {
                /* geolocation is available */
                navigator.geolocation.getCurrentPosition(this.checkLocationServicesSuccess.bind(this),
                                                         this.checkLocationServicesError.bind(this),
                                                         geo_options);
            } else {
                /* geolocation IS NOT available */
                this.checkLocationServicesError(); 
            }
                        
        },
    
        
        /*
         *
         */
        checkLocationServicesSuccess : function (position) { 
            console.log ("Success! Latitude: " + position.coords.latitude + " Longtitude: " + position.coords.longitude);
            
            /* Flip the geolocation status flag to true */
            this.geolocationStatus = true;
            
            /* store the position in the object */ 
            this.position = position; 
            
            /* Update the centre of the map */ 
            this.updateMapCentrePosition(this.position.coords.latitude, this.position.coords.longitude);
            
            /* Search for places around you */ 
            this.searchForSCCPlaces(this.position.coords.latitude, this.position.coords.longitude); 
            
        },
        
        
        /*
         *
         */
        checkLocationServicesError : function (error) { 
            this.geolocationStatus = false; 
            console.log ("Error: " + error.code + " - " + error.message);
            
            this.writeErrorMessage("Error! Code: " + error.code + " - " + error.message);
            
        },
        
        /*
         * Move the map to the centre position provided
         */
        updateMapCentrePosition : function (latitude, longitude) { 
            
           this.map.panTo({lat: latitude, lng: longitude});
           this.map.setZoom(11);
            
        },
        
        
        /*
         * Write an error message 
         */
        writeErrorMessage : function (text) {
            
            this.messageContainer.empty(); 
            
            var alertMessage = document.createElement('div');
            alertMessage.className = "alert alert-danger";
                        
            jQuery('<p/>', {
                text: text 
            }).appendTo(alertMessage);
            
            this.messageContainer.append(alertMessage);
            
        },
        
        
        /*
         * Write an error message 
         */
        clearMessage : function () {
            
            this.messageContainer.empty();
            
        },
        
        
        /*
         * Search Google Maps Places API 
         * for any Service Canada Centres 
         */
        searchForSCCPlaces : function (latitude, longitude) { 
            
            /* Check that a search location is set (either via geo locator or location box) */
            if ( this.geolocationStatus ) { 
                
                console.log("Searching for places")
                
                var service = new google.maps.places.PlacesService(this.map);
                
                service.nearbySearch({
                    location: {lat: latitude, lng: longitude},
                    radius: 35000,
                    keyword: ['"Service+Canada+Centre"']
                }, this.drawTheSearchResults.bind(this));

            }
                                
        },
        
        
        /*
         * Draw the map container 
         */
        drawTheSearchResults : function (results, status) {
            
            console.log("Got the results from the search");
            this.resultsContainer.empty(); 
            
            /* Check that the status of the search for places went okay */ 
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                
                var filteredResults = []; 
                var counter = 0; 
                
                /* Walk through the results and filter out the stuff we don't want */ 
                for ( var i = 0; i < results.length; i++ ) {
                    
                    if ( results[i].name == this.placesNameFilter )
                    {
                        filteredResults[counter++] = results[i];    
                    }
                    
                }
                
                /* No Results - update the error message */
                if ( filteredResults.length == 0 ) { 
                    this.writeErrorMessage("Whoops! No results found near the location!");
                }
                
                console.log("Number of places found: " + filteredResults.length );
                
                /* Walk throught the filtered results and then draw */
                for ( var i = 0; i < filteredResults.length; i++ ) {
                    
                    /* Add the result to the map */ 
                    var placeLoc = results[i].geometry.location;
                    var marker = new google.maps.Marker({
                        map: this.map,
                        animation: google.maps.Animation.DROP,
                        position: results[i].geometry.location
                    });
                    
                    /* Add the result to the dom */ 
                        
                    /* First pass - wipe and then add a heading to the results section */ 
                    if ( i == 0 ) { 

                        jQuery('<h2/>', {
                            text: 'Search Results:'
                        }).appendTo(this.resultsContainer);

                        jQuery('<ul/>', {
                            class: 'list-group',
                            id: 'sccSearchResults'
                        }).appendTo(this.resultsContainer);

                    }

                    /* Here is the DOM Objects we need to create  

                        <ul class="list-group">
                          <li class="list-group-item">
                            <h4 class="list-group-item-heading">...</h4>
                            <p class="list-group-item-text">...</p>
                          </li>
                          ...
                        </ul>

                    */

                    var searchResult = document.createElement('li');
                    searchResult.classList.add("list-group-item")

                    jQuery('<h3/>', {
                        class: 'list-group-item-heading h4',
                        text: results[i].vicinity 
                    }).appendTo(searchResult);

                    var openText; 

                    if ( results[i].opening_hours.open_now ) { 
                        openText = "Currently open!"
                    }
                    else { 
                        openText = "Currently closed."
                    }

                    jQuery('<p/>', {
                        class: 'list-group-item-text',
                        text: openText
                    }).appendTo(searchResult);


                    document.getElementById('sccSearchResults').appendChild(searchResult);

                }
                
            }        
        }
                
    };
