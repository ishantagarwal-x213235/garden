/*
 * Copyright (C) 2018-2023 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { expect } from "chai"
import { ResolvedBuildAction } from "../../../../src/actions/build"
import { ConfigGraph } from "../../../../src/graph/config-graph"
import { ActionLog } from "../../../../src/logger/log-entry"
import { ActionRouter } from "../../../../src/router/router"
import { GardenModule } from "../../../../src/types/module"
import { TestGarden } from "../../../helpers"
import { getRouterTestData } from "./_helpers"

describe("build actions", () => {
  let garden: TestGarden
  let graph: ConfigGraph
  let log: ActionLog
  let actionRouter: ActionRouter
  let resolvedBuildAction: ResolvedBuildAction
  let module: GardenModule

  before(async () => {
    const data = await getRouterTestData()
    garden = data.garden
    graph = data.graph
    log = data.log
    actionRouter = data.actionRouter
    resolvedBuildAction = data.resolvedBuildAction
    module = data.module
  })

  after(async () => {
    garden.close()
  })

  describe("build.getStatus", () => {
    it("should correctly call the corresponding plugin handler", async () => {
      const { result } = await actionRouter.build.getStatus({ log, action: resolvedBuildAction, graph })
      expect(result.outputs.foo).to.eql("bar")
    })

    it("should emit buildStatus events", async () => {
      garden.events.eventLog = []
      await actionRouter.build.getStatus({ log, action: resolvedBuildAction, graph })

      const event1 = garden.events.eventLog[0]
      const event2 = garden.events.eventLog[1]

      expect(event1).to.exist
      expect(event1.name).to.eql("buildStatus")
      expect(event1.payload.moduleName).to.eql("module-a")
      expect(event1.payload.actionUid).to.be.ok
      expect(event1.payload.state).to.eql("getting-status")
      expect(event1.payload.status.state).to.eql("fetching")

      expect(event2).to.exist
      expect(event2.name).to.eql("buildStatus")
      expect(event2.payload.moduleName).to.eql("module-a")
      expect(event2.payload.actionUid).to.eql(event1.payload.actionUid)
      expect(event2.payload.state).to.eql("cached")
      expect(event2.payload.status.state).to.eql("fetched")
    })
  })

  describe("build", () => {
    it("should correctly call the corresponding plugin handler", async () => {
      const { result } = await actionRouter.build.build({ log, action: resolvedBuildAction, graph })
      expect(result).to.eql({
        detail: {},
        outputs: {
          foo: "bar",
          isTestPluginABuildActionBuildHandlerReturn: true,
        },
        state: "ready",
      })
    })

    it("should emit buildStatus events", async () => {
      garden.events.eventLog = []
      await actionRouter.build.build({ log, action: resolvedBuildAction, graph })
      const event1 = garden.events.eventLog[0]
      const event2 = garden.events.eventLog[1]

      expect(event1).to.exist
      expect(event1.name).to.eql("buildStatus")
      expect(event1.payload.moduleName).to.eql("module-a")
      expect(event1.payload.actionUid).to.be.ok
      expect(event1.payload.state).to.eql("processing")
      expect(event1.payload.status.state).to.eql("building")

      expect(event2).to.exist
      expect(event2.name).to.eql("buildStatus")
      expect(event2.payload.moduleName).to.eql("module-a")
      expect(event2.payload.actionUid).to.eql(event1.payload.actionUid)
      expect(event2.payload.state).to.eql("ready")
      expect(event2.payload.status.state).to.eql("built")
    })
  })
})
