(function(env) {
    "use strict";
    env.ddg_spice_seat_geek_events_by_artist = function(api_result) {

        if(!api_result || api_result.error || api_result.events.length === 0) {
            return Spice.failed('seat_geek_events_by_artist');
        }

         // Get the original query.
        var script = $('[src*="/js/spice/seat_geek/events_by_artist/"]')[0],
            source = $(script).attr("src"),
            artistSlug = source.match(/events_by_artist\/([^\/]*)/)[1];

        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        Spice.add({
            id: "seat_geek_events_by_artist",
            name: "Tickets",
            data: api_result.events,
            meta: {
                sourceName: "SeatGeek",
                sourceUrl: "https://seatgeek.com/search?search=" + artistSlug.replace(/-/g, "+"),
                sourceIconUrl: "https://seatgeek.com/favicon.ico",
                itemType: "Upcoming Concerts",
                searchTerm: artistSlug.replace(/-/g,' ')
            },
            normalize: function(item) {
                var artistDisplayName = capitalizedAcronym(artistSlug),
                    performersWithGenres;

                // sometimes we get false positives from the SeatGeek API
                // where for example sports games get displayed instead of concerts
                //
                // filtering out events whose performers don't have genres
                // seems to be a way to guard against that
                performersWithGenres = $.grep(item.performers, function (performer) {
                  return !!performer.genres;
                });

                if (performersWithGenres.length === 0) {
                  return null;
                }

                // Capitalize the name of the band/artist searched for;
                // if the name is composed by multiple words, capitalize
                // all of them; if the name is too long, return the acronym

                function capitalizedAcronym(string) {
                    var splitted = string.split("-"),
                        i,
                        acronym,
                        upper;

                    if(string.length < 18) {
                        for(i = 0; i < splitted.length; i++) {
                            splitted[i] = DDG.capitalize(splitted[i]);
                        }

                        return splitted.join(" ");
                    } else {
                        acronym = '';
                        for(i = 0; i < splitted.length; i++) {
                            upper = splitted[i].substr(0, 1).toUpperCase() + '.';
                            acronym += upper;
                        }

                        return acronym;
                    }
                }

                function getDate(date) {
                    if(date) {
                        // IE 8 and Safari don't support the yyyy-mm-dd date format,
                        // but they support mm/dd/yyyy
                        date = date.replace(/T.*/, '');
                        var remix_date = date.split("-");
                        date = remix_date[1] + "/" + remix_date[2] + "/" + remix_date[0];

                        date = new Date(date);
                        return date;
                    }

                    return;
                }

                function getMonth(date) {
                    if(date) {
                        var month = months[parseInt(date.getMonth())];
                        return month.toUpperCase();
                    }

                    return;
                }

                function getDay(date) {
                    if(date) {
                        var day = date.getDate();
                        return day;
                    }

                    return;
                }

                // Get number of performers, excluding
                // the one searched for

                function getNumPerformers(performers) {
                    var how_many = 0,
                        i;

                    for(i = 0; i < performers.length; i++) {
                        if(performers[i].slug !== artistSlug) {
                            how_many++;
                        }
                    }

                    if(how_many > 1) {
                        return how_many;
                    }

                    return 0;
                }

                function getPrice(lowest, highest) {
                    var price = "";

                    if(lowest && highest) {
                        price = "$" + lowest + "+";
                    }

                    return price;
                }
                
                function getSubtitle(performers) {
                    var num = getNumPerformers(performers),
                        str = ' ';

                    if (num > 0) {
                        str = artistDisplayName + ' and '+ num + ' others';
                    }
                    return str;
                }

                return {
                    url: item.url,
                    price: getPrice(item.stats.lowest_price, item.stats.highest_price),
                    artist: artistDisplayName,
                    subtitle: getSubtitle(item.performers),
                    title: item.short_title,
                    place: item.venue.name,
                    img: item.performers[0].images.small,
                    city: item.venue.display_location,
                    dateBadge: {
                        month: getMonth(getDate(item.datetime_local)),
                        day: getDay(getDate(item.datetime_local))
                    }
                };
            },
            templates: {
                group: 'text',
                detail: false,
                item_detail: false,
                options: {
                    moreAt: true,
                    rating: false,
                    footer: Spice.seat_geek_events_by_artist.footer
                },
                variants: {
                    tileTitle: '3line-small',
                    tileFooter: '4line'
                }
            }
        });
    };
}(this));
