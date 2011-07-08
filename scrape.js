var Scraper = (function () {
	// TODO: Abstract scraping
	// TODO: Build up list of pages to scrape then scrape (this will be good for custom lists)
	// TODO: Performance enhancers
	//    Move away from using each
	var _public      = {},
			friendShorts = {},
			doneParsing  = true,
			appendFriendShorts,
			getAllFriendShorts,
			incrSectionsRetrieved,
			generateFriendBlock,
			sectionsRequested = 0,
			sectionsRetrieved = 0,
			touchedURLs = {};

	incrSectionsRetrieved = function (onComplete) {
		sectionsRetrieved += 1;
		if( sectionsRetrieved < sectionsRequested ) {
			return;
		}
		return onComplete();
	};

	appendFriendShorts = function (pageData) {
		var $friendShorts = friendShorts;

		// Create HTMLDocument via jQuery (just easier)
		jQuery(pageData).find('#sections a[name][href]').each( function () {
			var name = this.name,
					href = this.href,
					img  = '',
					imgElt  = this,
					isImg = function (elt) {
						return elt.tagName.toLowerCase() === "img";
					},
					$arr,
					body = document.body;

			// Determine proper URI
			href += ( name.indexOf('?') === -1 ) ? '?' : '&';
			href += 'v=info';

			// Find profile picture
			while( !isImg(imgElt) ) {
				if( imgElt === body ) {
					break;
				}
				$arr = jQuery(imgElt).siblings('img');
				if( $arr && $arr.length > 0 ) {
					imgElt = $arr[0];
				} else {
					imgElt = imgElt.parentNode;
				}
			}
			if( imgElt !== body ) {
				// q is small and square, t is taller, s is medium, b (or n) is big, o to download big
				img = (imgElt.src + '').replace('_q', '_s');
			}

			// Store by name
			$friendShorts[ name ] = {'name': name, 'href': href, 'img': img};
		});
	};

	getAllFriendShorts = function getAllFriendShorts(url, callback) {
		var $appendFriendShorts = appendFriendShorts,
				$friendShorts        = friendShorts;

		touchedURLs[url] = true;
		sectionsRequested += 1;
		// TODO: Implement failsafe upon failed retrieval
		// Create HTMLDocument via jQuery (just easier)
		jQuery.get(url, function (data) {
			var $$appendFriendShorts = $appendFriendShorts,
					$nameSections        = jQuery(data).find('#sections a.sec'),
					callbackFn;

			if( $nameSections && $nameSections.length > 0 ) {
				sectionsRequested -= 1;
				$nameSections.each( function () {
					var href = this.href;
					if( !touchedURLs[href] ) {
						getAllFriendShorts( this.href, callback );
					} else {
						$$appendFriendShorts(data);
						incrSectionsRetrieved( callback );
					}
				});
			} else {
				$$appendFriendShorts(data);
				incrSectionsRetrieved( callback );
			}
		});

		// Overwrite so no extra calls are made
		getAllFriendShorts = $friendShorts;
		return $friendShorts;
	};

	// TODO: Change to generateAllFriendBlocks (with custom callback for generating button to go to next step; aggregate selected friend data)
	getAllFriendInfo = function (urls) {
		var i, len, key, keys, $friendShorts;
		// Only one scrape at a time (because I am not that smart)
		if( !doneParsing ) {
			return {};
		}

		if( !urls ) {
			return getAllFriendShorts('http://m.facebook.com/friends.php?refid=0', function () {
				$friendShorts = friendShorts;
				keys = [];
				console.log( 'Completed sort' );
				document.body.innerHTML = '';
				
				// Collect keys and sort reverse alphabetically
				for( key in $friendShorts ) {
					if( $friendShorts.hasOwnProperty(key) ) {
						keys[ keys.length ] = key;
					}
				}
				keys.sort( function (a, b) { return a < b; } );
				
				// Moved from tail to head creating 'FriendBlock's
				for( i = keys.length; i--; ) {
					document.body.appendChild( generateFriendBlock( $friendShorts[ keys[i] ] ) );
				}
			});
		}
		// TODO: Handle url's portion
	};

	generateFriendBlock = function (friendInfo) {
		var doc   = document,
				container = doc.createElement('div'),
				rightDiv  = doc.createElement('div'),
				img   = doc.createElement('img'),
				name  = doc.createElement('h3'),
				input = doc.createElement('input');

		// TODO: Transfer style settings
		container.className = 'friendBlock';
		container.setAttribute( 'style', 'border: 1px solid black; margin: 3px; padding: 2px; display: inline-block;' );
		
		rightDiv.className = 'friendBlockRight';
		rightDiv.setAttribute( 'style', 'display: inline-block;' );

		img.src          = friendInfo.img;

		input.type       = 'checkbox';
		input.name       = 'friendCheckbox';
		input.value      = friendInfo.href;
		input.setAttribute( 'checked', 'checked' );

		name.innerText   = friendInfo.name;
		name.textContent = friendInfo.name;

		container.appendChild( img );

		rightDiv.appendChild( name );
		rightDiv.appendChild( input );

		container.appendChild( rightDiv );
		return container;
	};

	_public.getAllFriendInfo = getAllFriendInfo;
	return _public;
}());
Scraper.getAllFriendInfo();