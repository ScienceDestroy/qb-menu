local QBCore = exports['qb-core']:GetCoreObject()
RegisterNetEvent('QBCore:Client:UpdateObject', function() QBCore = exports['qb-core']:GetCoreObject() end)

-- Menu Variables
local menuOpen = false
local entities = {}
local header = ""

-- Functions

-- Define closeMenu first since it's used by other functions
local function closeMenu(withNui)
    if withNui then
        SendNUIMessage({
            action = "CLOSE_MENU"
        })
    end
    
    SetNuiFocus(false, false)
    menuOpen = false
end

local function sortData(data, skipFirst)
    if not data or #data < 2 then return data end
    
    local result = {}
    for i, v in ipairs(data) do
        result[i] = v
    end
    
    if skipFirst then
        local firstItem = table.remove(result, 1)
        table.sort(result, function(a, b)
            if a.header and b.header then
                return tostring(a.header):lower() < tostring(b.header):lower()
            end
            return false
        end)
        table.insert(result, 1, firstItem)
    else
        table.sort(result, function(a, b)
            if a.isMenuHeader then return true end
            if b.isMenuHeader then return false end
            if a.header and b.header then
                return tostring(a.header):lower() < tostring(b.header):lower()
            end
            return false
        end)
    end
    
    return result
end

local function showMenu(data, sort, skipFirst)
    if not data or not next(data) then 
        print("No menu data provided")
        return 
    end
    
    -- Deep copy the data to avoid modifying the original
    local menuData = {}
    for i, v in ipairs(data) do
        menuData[i] = {}
        for k, val in pairs(v) do
            if k == "params" and type(val) == "table" then
                menuData[i][k] = {}
                for paramK, paramV in pairs(val) do
                    menuData[i][k][paramK] = paramV
                end
            else
                menuData[i][k] = val
            end
        end
    end
    
    -- Sort the data if requested
    if sort then
        menuData = sortData(menuData, skipFirst)
    end
    
    -- Process icons and ensure proper structure
    for _, v in pairs(menuData) do
        -- Handle FontAwesome icons
        if v.icon and string.find(v.icon, "fa%-") then
            -- Keep FontAwesome icons as is
        -- Handle item icons
        elseif v.icon and QBCore.Shared.Items[tostring(v.icon)] then
            if not string.find(QBCore.Shared.Items[tostring(v.icon)].image, "//") then
                v.icon = "nui://qb-inventory/html/images/"..QBCore.Shared.Items[tostring(v.icon)].image
            end
        end
        
        -- Ensure params structure is correct
        if v.params then
            if v.params.args and type(v.params.args) ~= "table" then
                v.params.args = { v.params.args }
            end
        end
    end

    if menuOpen then
        closeMenu(true)
        Wait(100)
    end

    menuOpen = true
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = "OPEN_MENU",
        data = menuData
    })
end

local function showHeader(data)
    if not data or not next(data) then return end
    header = data[1].header
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = "SHOW_HEADER",
        data = data
    })
end

-- Events

RegisterNetEvent('qb-menu:client:openMenu', function(data, sort, skipFirst)
    showMenu(data, sort, skipFirst)
end)

RegisterNetEvent('qb-menu:client:closeMenu', function()
    closeMenu(true)
end)

-- NUI Callbacks

RegisterNUICallback('clickedButton', function(data, cb)
    PlaySoundFrontend(-1, 'Highlight_Cancel','DLC_HEIST_PLANNING_BOARD_SOUNDS', 1)
    
    local buttonData = data.data
    if buttonData and buttonData.params then
        if buttonData.params.event then
            if buttonData.params.isServer then
                TriggerServerEvent(buttonData.params.event, buttonData.params.args or {})
            elseif buttonData.params.isCommand then
                ExecuteCommand(buttonData.params.event)
            elseif buttonData.params.isQBCommand then
                TriggerServerEvent('QBCore:CallCommand', buttonData.params.event, buttonData.params.args or {})
            elseif buttonData.params.isAction then
                buttonData.params.event(buttonData.params.args or {})
            else
                TriggerEvent(buttonData.params.event, buttonData.params.args or {})
            end
        end

        if buttonData.params.shouldKeepInput then
            SetNuiFocus(true, true)
        else
            if not buttonData.params.keepMenu then
                closeMenu(true)
            end
        end
    end
    
    cb("ok")
end)

RegisterNUICallback('closeMenu', function(_, cb)
    closeMenu(true)
    cb("ok")
end)

-- Command and Key Mapping

RegisterCommand('playerfocus', function()
    if header ~= "" then
        SetNuiFocus(true, true)
    end
end)

RegisterKeyMapping('playerfocus', 'Give Menu Focus', 'keyboard', 'LMENU')

-- Exports

exports('openMenu', showMenu)
exports('closeMenu', closeMenu)
exports('showHeader', showHeader)

-- Threads

CreateThread(function()
    while true do
        Wait(0)
        if menuOpen then
            if IsControlJustPressed(0, 177) then
                closeMenu(true)
            end
        else
            Wait(500)
        end
    end
end)