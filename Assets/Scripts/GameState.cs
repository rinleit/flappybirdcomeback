using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;


public enum GameState
{
    Login,
    Intro,
    Playing,
    Dead
}

public static class GameStateManager
{
    public static GameState GameState { get; set; }

    static GameStateManager ()
    {
        GameState = GameState.Login;
    }

}

