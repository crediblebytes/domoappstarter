# Domo Apps CLI Commands
domo init
domo logout
domo login
domo publish
domo dev
domo dev --NODE_ENV="Development"


# Notes
Another way to get the proxy id is right click on the card and "View Frame Source" 
The proxy id is found inside the URL:
https://{proxyid}.domoapps.prod1.domo.com

Rather than having one collection for development & prod you can either
Use local storage with environment variables 
Create a card(instance) of the same app. One for Development, Stage,  & Prod and name the collections appropriately. Then conditionally handle a cell edit based on the environment variable.


# TODO
Now as you start to check the owned field in the table for each row, it should create a new document only when one doesn't already exist.

There is still some best practice clean up to do to handle error cases (when any request to AppDB fails, but we'll leave that as a challenge after training).


# Questions
When to use code engine?
Custom app would make requests to Code Engine that would interface with 3rd party so credentials are not stored on the client.
We can hire Domo to build it out as well.

# AI Use Case

Propense.ai uses customer data inside emails to make cross selling easier. 
We want to bring in customer data inside gmail via google app scripts.
But we also want to make suggestions based on "similar" clients on what services to offer based on what other similar clients have.