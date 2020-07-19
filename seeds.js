const faker = require('faker'),
      Campground = require('./models/campground'),
      keyPublishable = process.env.PUBLISHABLE_KEY;

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding"),
   geocodingClient = mbxGeocoding({
      accessToken: process.env.MAPBOX
   });

const imgUrls=[
   "https://images.unsplash.com/photo-1533873984035-25970ab07461?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
   "https://images.unsplash.com/photo-1476041800959-2f6bb412c8ce?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
   "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
   "https://images.unsplash.com/photo-1526491109672-74740652b963?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
   "https://images.unsplash.com/photo-1549221838-126dc3ebf29f?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60"
];

const cities=[
   "Mumbai",
   "Pune",
   "Delhi",
   "Chennai",
   "Bangalore"
]

async function seedCampsites() {
   //  await Campground.deleteMany({});
    for (const i of new Array(27)) {
        const title = faker.lorem.word();
        const content = faker.lorem.text();
        const index=Math.floor(Math.random()*5);
        const img=imgUrls[index];
        const location=cities[Math.floor(Math.random()*5)];
        const price=Math.floor(Math.random()*5000)+100;
        const campsiteData = {
            title,
            content,
            img,
            location,
            price,
        }
        
        let campsite = await Campground.create(campsiteData);
        campsite.author.username = "sb";
        campsite.author.id = "5efca4577cc2b3358cdc63bc";
        let response = await geocodingClient.forwardGeocode({
            query: campsite.location,
            limit: 1
         }).send();
         campsite.coordinates = response.body.features[0].geometry.coordinates;
         campsite.save();
    }
    console.log('27 new campsites created');
}

module.exports = seedCampsites;

