import React from "react";

// Declaring the state object globally.
const initialLocationState = {
  location: null,
  nearbySites: [],
};

const locationContextWrapper = (component) => ({
  ...initialLocationState,
  setLocation: (location) => {
    initialLocationState.location = location;
    component?.setState({ context: locationContextWrapper(component) });
  },
  setNearbySites: (sites) => {
    initialLocationState.nearbySites = sites;
    component?.setState({ context: locationContextWrapper(component) });
  },
});

export const LocationContext = React.createContext(locationContextWrapper());

export class LocationContextProvider extends React.Component {
  state = {
    context: locationContextWrapper(this),
  };

  render() {
    return (
      <LocationContext.Provider value={this.state.context}>
        {this.props.children}
      </LocationContext.Provider>
    );
  }
}
