import { expect } from "chai";
import { ethers } from "hardhat";
import { Ajo } from "../typechain-types";

describe("Ajo", function () {
  // We define a fixture to reuse the same setup in every test.

  let ajo: Ajo;
  before(async () => {
    const [owner] = await ethers.getSigners();
    const ajoFactory = await ethers.getContractFactory("Ajo");
    ajo = (await ajoFactory.deploy(owner.address)) as Ajo;
    await ajo.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should have the right message on deploy", async function () {
      expect(await ajo.greeting()).to.equal("Building Unstoppable Apps!!!");
    });

    it("Should allow setting a new message", async function () {
      const newGreeting = "Learn Scaffold-Lisk! :)";

      await ajo.setGreeting(newGreeting);
      expect(await ajo.greeting()).to.equal(newGreeting);
    });
  });
});
