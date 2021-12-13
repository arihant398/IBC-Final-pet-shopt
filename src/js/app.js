App = {
    web3Provider: null,
    contracts: {},

    init: async function () {
        // Load pets.
        $.getJSON("../pets.json", function (data) {
            var petsRow = $("#petsRow");
            var petTemplate = $("#petTemplate");

            for (i = 0; i < data.length; i++) {
                petTemplate.find(".panel-title").text(data[i].name);
                petTemplate.find("#img-one").attr("src", data[i].picture);
                petTemplate.find(".pet-breed").text(data[i].breed);
                petTemplate.find(".pet-age").text(data[i].age);
                petTemplate.find(".pet-location").text(data[i].location);
                petTemplate.find(".btn-adopt").attr("data-id", data[i].id);
                petTemplate.find(".btn-more-info").attr("data-id", data[i].id);
                petsRow.append(petTemplate.html());
            }
        });

        return await App.initWeb3();
    },

    initWeb3: async function () {
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
            try {
                // Request account access
                await window.ethereum.request({
                    method: "eth_requestAccounts",
                });
            } catch (error) {
                // User denied account access...
                console.error("User denied account access");
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
        }
        // If no injected web3 instance is detected, fall back to Ganache
        else {
            App.web3Provider = new Web3.providers.HttpProvider(
                "http://localhost:7545"
            );
        }
        web3 = new Web3(App.web3Provider);

        return App.initContract();
    },

    initContract: function () {
        $.getJSON("Adoption.json", function (data) {
            // Get the necessary contract artifact file and instantiate it with @truffle/contract
            var AdoptionArtifact = data;
            App.contracts.Adoption = TruffleContract(AdoptionArtifact);

            // Set the provider for our contract
            App.contracts.Adoption.setProvider(App.web3Provider);

            // Use our contract to retrieve and mark the adopted pets
            return App.markAdopted();
        });

        return App.bindEvents();
    },

    bindEvents: function () {
        $(document).on("click", ".btn-adopt", App.handleAdopt);
        $(document).on("click", ".btn-more-info", App.showModal);
        $(document).on("click", ".btn-doante", App.handleDonate);
    },

    markAdopted: function () {
        var adoptionInstance;

        App.contracts.Adoption.deployed()
            .then(function (instance) {
                adoptionInstance = instance;
                return adoptionInstance.getAdopters.call();
            })
            .then(function (adopters) {
                for (i = 0; i < adopters.length; i++) {
                    if (
                        adopters[i] !==
                        "0x0000000000000000000000000000000000000000"
                    ) {
                        $(".panel-pet")
                            .eq(i)
                            .find("#adopt_button")
                            .text("Adopted")
                            .attr("disabled", true);
                    }
                }
                // for (i = 0; i < adopters.length; i++) {
                //     if (
                //         adopters[i] !==
                //         "0x0000000000000000000000000000000000000000"
                //     ) {
                //         $(".modal-pet")
                //             .eq(i)
                //             .find("#adopt_button-two")
                //             .text("Adopted")
                //             .attr("disabled", true);
                //     }
                // }
            })
            .catch(function (err) {
                console.log(err.message);
            });
    },

    handleAdopt: function (event) {
        event.preventDefault();

        var petId = parseInt($(event.target).data("id"));

        var adoptionInstance;
        console.log(petId);

        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.log(error);
            }

            var account = accounts[0];

            App.contracts.Adoption.deployed()
                .then(function (instance) {
                    adoptionInstance = instance;

                    // Execute adopt as a transaction by sending account
                    return adoptionInstance.adopt(petId, { from: account });
                })
                .then(function (result) {
                    return App.markAdopted();
                })
                .catch(function (err) {
                    console.log(err.message);
                });
        });
    },

    showModal: function (event) {
        event.preventDefault();
        var petId = parseInt($(event.target).data("id"));

        $.getJSON("../pets.json", function (data) {
            var petModal = $("#petModal");
            petModal.find(".modalName").text(data[petId].name);
            petModal.find(".pet-breed").text(data[petId].breed);
            petModal.find(".pet-age").text(data[petId].age);
            petModal.find(".pet-location").text(data[petId].location);
            petModal.find(".pet-allergies").text(data[petId].Allergies);
            petModal.find(".pet-food").text(data[petId].food);
            petModal.find(".vaccine").text(data[petId].vaccine);
            petModal.find(".btn-adopt").attr("data-id", data[petId].id);
            petModal.find("#img-two").attr("src", data[petId].picture);
        });
    },
    handleDonate: function (event) {
        event.preventDefault();
        const form = document.getElementById("myForm");
        var new_pet_name = form.elements["pet_name"].value;
        var new_pet_Age = form.elements["pet_Age"].value;
        var new_pet_Breed = form.elements["pet_Breed"].value;
        var new_pet_Location = form.elements["pet_name"].value;

        $.getJSON("../pets.json", function (data) {
            var lenData = data.length;
            var newData = {
                id: 0,
                name: new_pet_name,
                picture: "images/scottish-terrier.jpeg",
                age: new_pet_Age,
                breed: new_pet_Breed,
                location: new_pet_Location,
            };
            data.push(newData);
            alert(
                "New pet data has been collected and the pet will be up for adoption once the data is verified"
            );
        });
    },
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
